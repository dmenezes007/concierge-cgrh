import type { VercelRequest, VercelResponse } from '@vercel/node';
import { list, del } from '@vercel/blob';
import Redis from 'ioredis';

/**
 * Health Check - Verifica consistência entre Redis e Blob Storage
 * E opcionalmente limpa arquivos órfãos do Blob
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { cleanup } = req.query; // ?cleanup=true para limpar automaticamente
    
    // 1. Buscar todos os documentos do Redis
    const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL;
    if (!redisUrl) {
      return res.status(500).json({ error: 'Redis não configurado' });
    }

    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
      }
    });

    const docIds = await redis.smembers('docs:all');
    const redisIds = new Set(docIds);
    
    console.log(`📊 Documentos no Redis: ${docIds.length}`);

    // 2. Buscar todos os documentos do Blob
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      await redis.quit();
      return res.status(500).json({ error: 'Blob Storage não configurado' });
    }

    const { blobs } = await list({
      prefix: 'docs/',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    console.log(`☁️ Documentos no Blob: ${blobs.length}`);

    // 3. Identificar documentos órfãos (no Blob mas não no Redis)
    const orphans: any[] = [];
    
    for (const blob of blobs) {
      const filename = blob.pathname.replace('docs/', '');
      
      // Gerar ID a partir do nome (mesmo algoritmo do upload)
      const title = filename.replace('.docx', '');
      const id = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (!redisIds.has(id)) {
        orphans.push({
          id,
          filename,
          url: blob.url,
          size: blob.size,
          uploadedAt: blob.uploadedAt
        });
      }
    }

    console.log(`🗑️ Arquivos órfãos encontrados: ${orphans.length}`);

    // 4. Limpar automaticamente se solicitado
    const cleaned: string[] = [];
    if (cleanup === 'true' && orphans.length > 0) {
      console.log('🧹 Iniciando limpeza automática...');
      
      for (const orphan of orphans) {
        try {
          await del(orphan.url, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          cleaned.push(orphan.filename);
          console.log(`✅ Deletado: ${orphan.filename}`);
        } catch (error: any) {
          console.error(`❌ Erro ao deletar ${orphan.filename}:`, error.message);
        }
      }
    }

    await redis.quit();

    // 5. Retornar relatório
    return res.status(200).json({
      success: true,
      summary: {
        redisDocuments: docIds.length,
        blobDocuments: blobs.length,
        orphansFound: orphans.length,
        cleaned: cleaned.length
      },
      orphans: orphans.map(o => ({
        filename: o.filename,
        id: o.id,
        size: `${(o.size / 1024).toFixed(1)} KB`,
        uploadedAt: o.uploadedAt
      })),
      cleanedFiles: cleaned,
      status: orphans.length === 0 ? 'healthy' : cleaned.length > 0 ? 'cleaned' : 'has-orphans',
      message: orphans.length === 0 
        ? '✅ Sistema está sincronizado' 
        : cleaned.length > 0
          ? `✅ ${cleaned.length} arquivos órfãos foram limpos`
          : `⚠️ ${orphans.length} arquivos órfãos encontrados. Use ?cleanup=true para limpar automaticamente`
    });

  } catch (error: any) {
    console.error('❌ Erro no health check:', error);
    return res.status(500).json({
      error: 'Erro ao executar health check',
      details: error.message
    });
  }
}
