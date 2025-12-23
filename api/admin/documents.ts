import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import { list, del } from '@vercel/blob';
import Redis from 'ioredis';

// Tentar importar KV de forma lazy
let kv: any = null;
let kvInitialized = false;

async function getKV() {
  if (!kvInitialized) {
    kvInitialized = true;
    
    // Verificar se as variáveis de ambiente do KV existem
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.log('Vercel KV not configured - using token-only authentication');
      return null;
    }
    
    try {
      const kvModule = await import('@vercel/kv');
      kv = kvModule.kv;
      console.log('Vercel KV initialized successfully');
    } catch (error) {
      console.warn('Error loading Vercel KV:', error);
      return null;
    }
  }
  return kv;
}

// Middleware para verificar autenticação
async function isAuthenticated(req: VercelRequest): Promise<boolean> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.split(' ')[1];

  const kvInstance = await getKV();
  if (kvInstance) {
    try {
      const session = await kvInstance.get(`admin_session:${token}`);
      return !!session;
    } catch (error) {
      console.warn('Erro ao validar token no KV');
    }
  }
  
  // Sem KV, aceitar qualquer token UUID válido
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificar autenticação
  const authenticated = await isAuthenticated(req);
  if (!authenticated) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    // GET - Listar documentos
    if (req.method === 'GET') {
      // 1. Listar documentos do Redis
      let redisDocs: any[] = [];
      const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL;
      
      if (redisUrl) {
        try {
          console.log('Listando documentos do Redis...');
          const redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
              if (times > 3) return null; // Stop retrying after 3 attempts
              return Math.min(times * 50, 2000);
            },
            lazyConnect: true // Don't connect immediately
          });
          
          // Tentar conectar com timeout
          await redis.connect();
          
          // Buscar todos os IDs de documentos
          const docIds = await redis.smembers('docs:all');
          console.log(`Encontrados ${docIds.length} documentos no Redis`);
          
          // Buscar dados de cada documento
          for (const id of docIds) {
            const doc = await redis.hgetall(`doc:${id}`);
            if (doc && doc.id) {
              redisDocs.push({
                id: doc.id,
                name: doc.title || id,
                size: doc.content ? doc.content.length : 0,
                modified: doc.createdAt || new Date().toISOString(),
                path: doc.blobUrl || '',
                blobUrl: doc.blobUrl || '', // Para deduplicação
                source: 'redis',
                keywords: doc.keywords || '',
                description: doc.description || ''
              });
            }
          }
          
          await redis.quit();
          console.log(`Processados ${redisDocs.length} documentos do Redis`);
        } catch (error: any) {
          console.error('Erro ao listar documentos do Redis:', error.message);
          // Não falhar a requisição, apenas continuar sem documentos do Redis
        }
      }
      
      // 2. Listar documentos do sistema de arquivos (docs/ - deployados)
      const docsPath = path.join(process.cwd(), 'docs');
      let fileSystemDocs: any[] = [];
      
      if (fs.existsSync(docsPath)) {
        fileSystemDocs = fs.readdirSync(docsPath)
          .filter(file => file.endsWith('.docx'))
          .map(file => {
            const stats = fs.statSync(path.join(docsPath, file));
            return {
              name: file,
              size: stats.size,
              modified: stats.mtime,
              path: `/docs/${file}`,
              source: 'filesystem'
            };
          });
      }

      // 3. Listar documentos do Vercel Blob Storage
      let blobDocs: any[] = [];
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          console.log('Listando documentos do Blob Storage...');
          const { blobs } = await list({
            prefix: 'docs/',
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          
          console.log(`Encontrados ${blobs.length} documentos no Blob`);
          
          blobDocs = blobs.map(blob => ({
            name: blob.pathname.replace('docs/', ''),
            size: blob.size,
            modified: blob.uploadedAt,
            path: blob.url,
            source: 'blob'
          }));
        } catch (error: any) {
          console.error('Erro ao listar Blob storage:', error.message);
        }
      } else {
        console.log('BLOB_READ_WRITE_TOKEN não configurado');
      }

      // Deduplicar: remover arquivos do Blob/filesystem que já estão no Redis
      // E também remover arquivos do Blob que NÃO estão no Redis (foram deletados)
      const redisUrls = new Set(redisDocs.map(d => d.blobUrl).filter(Boolean));
      const redisIds = new Set(redisDocs.map(d => d.id));
      
      console.log('IDs no Redis:', Array.from(redisIds));
      console.log('URLs no Redis para deduplicação:', Array.from(redisUrls));
      
      // Para cada documento do Blob, verificar se ainda está no Redis
      const uniqueBlobDocs = blobDocs.filter(d => {
        // Gerar ID a partir do nome do arquivo (mesmo algoritmo do upload)
        const title = d.name.replace('.docx', '');
        const id = title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // Se o documento NÃO está no Redis, significa que foi deletado
        const wasDeleted = !redisIds.has(id);
        
        if (wasDeleted) {
          console.log(`🗑️ Documento deletado do Redis mas ainda no Blob: ${d.name} (ID: ${id})`);
          return false; // NÃO mostrar na lista
        }
        
        // Também checar se já está no Redis via URL (duplicata)
        const isDuplicate = redisUrls.has(d.path);
        if (isDuplicate) {
          console.log(`🔄 Removendo duplicata: ${d.name} (já existe no Redis)`);
          return false;
        }
        
        return true; // Mostrar apenas se NÃO foi deletado e NÃO é duplicata
      });
      
      // Também deduplar filesystem - normalizar nomes para comparação
      const redisNamesNormalized = new Set(
        redisDocs.map(d => {
          // Remover extensão e normalizar espaços
          const normalized = d.name.toLowerCase()
            .replace(/\.docx$/i, '')
            .replace(/\s+/g, ' ')
            .trim();
          return normalized;
        })
      );
      
      const uniqueFileSystemDocs = fileSystemDocs.filter(d => {
        const normalizedName = d.name.toLowerCase()
          .replace(/\.docx$/i, '')
          .replace(/\s+/g, ' ')
          .trim();
        const isDuplicate = redisNamesNormalized.has(normalizedName);
        if (isDuplicate) {
          console.log(`🔄 Removendo duplicata filesystem: ${d.name} (já indexado no Redis)`);
        }
        return !isDuplicate;
      });
      
      // Combinar (priorizar Redis > Blob > filesystem)
      const allDocs = [...redisDocs, ...uniqueBlobDocs, ...uniqueFileSystemDocs];

      console.log(`Total de documentos: ${allDocs.length} (${redisDocs.length} do Redis, ${uniqueBlobDocs.length} do Blob único, ${uniqueFileSystemDocs.length} do filesystem único)`);

      return res.status(200).json({ 
        documents: allDocs,
        count: allDocs.length,
        sources: {
          redis: redisDocs.length,
          blob: uniqueBlobDocs.length,
          filesystem: uniqueFileSystemDocs.length
        }
      });
    }

    // DELETE - Deletar documento
    if (req.method === 'DELETE') {
      const { filename } = req.query;
      
      if (!filename || typeof filename !== 'string') {
        return res.status(400).json({ error: 'Nome do arquivo é obrigatório' });
      }

      console.log('🗑️ Deletando arquivo:', filename);

      try {
        // 1. Tentar deletar do filesystem (docs/)
        const docsPath = path.join(process.cwd(), 'docs');
        const filePath = path.join(docsPath, filename);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('✅ Arquivo deletado do filesystem:', filePath);
        }

        // 2. Tentar deletar do Blob Storage
        if (process.env.BLOB_READ_WRITE_TOKEN) {
          try {
            const { blobs } = await list({
              prefix: 'docs/',
              token: process.env.BLOB_READ_WRITE_TOKEN,
            });
            
            const blob = blobs.find(b => 
              b.pathname === `docs/${filename}` || 
              b.pathname.endsWith(filename)
            );
            
            if (blob) {
              await del(blob.url, {
                token: process.env.BLOB_READ_WRITE_TOKEN,
              });
              console.log('✅ Arquivo deletado do Blob:', blob.url);
            }
          } catch (error: any) {
            console.warn('⚠️ Erro ao deletar do Blob:', error.message);
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Arquivo deletado com sucesso'
        });
        
      } catch (error: any) {
        console.error('❌ Erro ao deletar arquivo:', error);
        return res.status(500).json({
          error: 'Erro ao deletar arquivo',
          details: error.message
        });
      }
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error: any) {
    console.error('Erro em documents:', error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}
