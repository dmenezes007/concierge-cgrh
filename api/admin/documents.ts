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

      // Combinar (priorizar Redis > Blob > filesystem)
      const allDocs = [...redisDocs, ...blobDocs, ...fileSystemDocs];

      console.log(`Total de documentos: ${allDocs.length} (${redisDocs.length} do Redis, ${blobDocs.length} do Blob, ${fileSystemDocs.length} do filesystem)`);

      return res.status(200).json({ 
        documents: allDocs,
        count: allDocs.length,
        sources: {
          redis: redisDocs.length,
          blob: blobDocs.length,
          filesystem: fileSystemDocs.length
        }
      });
    }

    // DELETE - Deletar documento
    if (req.method === 'DELETE') {
      const { filename } = req.query;
      
      if (!filename || typeof filename !== 'string') {
        return res.status(400).json({ error: 'Nome do arquivo é obrigatório' });
      }

      // Verificar se o token do Blob está configurado
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return res.status(500).json({
          error: 'Blob Storage não configurado',
          message: 'A variável BLOB_READ_WRITE_TOKEN não foi encontrada.'
        });
      }

      // Tentar deletar do Blob Storage
      try {
        console.log(`Deletando arquivo do Blob: docs/${filename}`);
        await del(`docs/${filename}`, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        
        console.log(`Arquivo ${filename} deletado com sucesso do Blob`);
        
        return res.status(200).json({ 
          success: true,
          message: `Documento ${filename} deletado com sucesso do Blob Storage` 
        });
      } catch (error: any) {
        console.error('Erro ao deletar do blob:', error.message, error);
        
        // Se o arquivo está no filesystem (deployado), não pode deletar
        const filePath = path.join(process.cwd(), 'docs', filename);
        if (fs.existsSync(filePath)) {
          return res.status(403).json({ 
            error: 'Arquivo está no repositório Git',
            message: 'Este documento foi deployado via Git. Para removê-lo, delete o arquivo da pasta docs/ localmente e faça commit/push.',
            filename: filename
          });
        }
        
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error: any) {
    console.error('Erro em documents:', error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}
