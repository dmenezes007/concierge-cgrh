import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import { list, del } from '@vercel/blob';

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
      // Listar documentos do sistema de arquivos (docs/ - deployados)
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

      // Listar documentos do Vercel Blob Storage
      let blobDocs: any[] = [];
      try {
        const { blobs } = await list({
          prefix: 'docs/',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        
        blobDocs = blobs.map(blob => ({
          name: blob.pathname.replace('docs/', ''),
          size: blob.size,
          modified: blob.uploadedAt,
          path: blob.url,
          source: 'blob'
        }));
      } catch (error) {
        console.log('Blob storage não configurado ou vazio:', error);
      }

      // Combinar e remover duplicatas (priorizar blob)
      const blobNames = new Set(blobDocs.map(d => d.name));
      const uniqueFileSystemDocs = fileSystemDocs.filter(d => !blobNames.has(d.name));
      const allDocs = [...blobDocs, ...uniqueFileSystemDocs];

      return res.status(200).json({ 
        documents: allDocs,
        count: allDocs.length 
      });
    }

    // DELETE - Deletar documento
    if (req.method === 'DELETE') {
      const { filename } = req.query;
      
      if (!filename || typeof filename !== 'string') {
        return res.status(400).json({ error: 'Nome do arquivo é obrigatório' });
      }

      // Tentar deletar do Blob Storage
      try {
        await del(`docs/${filename}`, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        
        return res.status(200).json({ 
          success: true,
          message: `Documento ${filename} deletado com sucesso do Blob Storage` 
        });
      } catch (error: any) {
        console.error('Erro ao deletar do blob:', error);
        
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
