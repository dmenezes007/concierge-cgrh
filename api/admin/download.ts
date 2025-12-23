import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
import { head } from '@vercel/blob';

// Lazy load KV only if configured
let kv: any = null;
let kvInitialized = false;

function getKV() {
  if (!kvInitialized) {
    kvInitialized = true;
    const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;
    
    if (hasKVConfig) {
      try {
        const { kv: vercelKV } = require('@vercel/kv');
        kv = vercelKV;
        console.log('Vercel KV initialized successfully');
      } catch (error) {
        console.log('Vercel KV not available, using fallback');
      }
    } else {
      console.log('KV env vars not configured, using fallback');
    }
  }
  return kv;
}

async function isAuthenticated(req: VercelRequest): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  
  // Try KV first if available
  const kvStore = getKV();
  if (kvStore) {
    try {
      const session = await kvStore.get(`session:${token}`);
      return !!session;
    } catch (error) {
      console.log('KV check failed, using UUID fallback');
    }
  }
  
  // Fallback: Accept any valid UUID format token
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const authenticated = await isAuthenticated(req);
  if (!authenticated) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    const { filename } = req.query;

    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ error: 'Nome do arquivo não fornecido' });
    }

    // Security: prevent path traversal
    const safeName = path.basename(filename);
    
    // Primeiro, tentar buscar no Redis para pegar o blobUrl
    try {
      const Redis = (await import('ioredis')).default;
      const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL;
      
      if (redisUrl) {
        const redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy(times) {
            if (times > 3) return null;
            return Math.min(times * 50, 2000);
          }
        });
        
        // Gerar ID a partir do filename (mesmo algoritmo do upload)
        const docId = safeName
          .replace('.docx', '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        console.log('🗑️ Buscando documento no Redis:', docId);
        const doc = await redis.hgetall(`doc:${docId}`);
        
        if (doc && doc.blobUrl) {
          console.log('✅ Documento encontrado no Redis, baixando do Blob:', doc.blobUrl);
          
          // Buscar diretamente do blob URL
          const response = await fetch(doc.blobUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${response.status}`);
          }
          
          const buffer = await response.arrayBuffer();
          
          await redis.quit();
          
          // Set headers for download
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeName)}"`);
          res.setHeader('Content-Length', buffer.byteLength);
          res.setHeader('Cache-Control', 'no-cache');

          return res.status(200).send(Buffer.from(buffer));
        }
        
        await redis.quit();
      }
    } catch (redisError) {
      console.warn('⚠️ Erro ao buscar no Redis:', redisError);
    }
    
    // Fallback: Tentar buscar do Blob Storage diretamente
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blobInfo = await head(`docs/${safeName}`, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        
        console.log('✅ Arquivo encontrado no Blob, baixando:', blobInfo.url);
        
        const response = await fetch(blobInfo.url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.status}`);
        }
        
        const buffer = await response.arrayBuffer();
        
        // Set headers for download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeName)}"`);
        res.setHeader('Content-Length', buffer.byteLength);
        res.setHeader('Cache-Control', 'no-cache');

        return res.status(200).send(Buffer.from(buffer));
        
      } catch (blobError) {
        console.log('⚠️ Arquivo não encontrado no Blob:', blobError);
      }
    }
    
    // Se não está no Blob, tentar filesystem
    const docsDir = path.join(process.cwd(), 'docs');
    const filePath = path.join(docsDir, safeName);

    // Verify file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Read file
    const fileBuffer = fs.readFileSync(filePath);

    // Set headers for download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeName)}"`);
    res.setHeader('Content-Length', fileBuffer.length);

    return res.status(200).send(fileBuffer);
  } catch (error: any) {
    console.error('Erro no download:', error);
    return res.status(500).json({ error: 'Erro ao fazer download do documento' });
  }
}
