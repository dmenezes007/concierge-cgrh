import type { VercelRequest, VercelResponse } from '@vercel/node';
import Redis from 'ioredis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'documentId não fornecido' });
    }

    const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL;
    if (!redisUrl) {
      console.warn('Redis não configurado - visualização não rastreada');
      return res.status(200).json({ success: true, tracked: false });
    }

    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
      }
    });

    // Incrementar contador de visualizações
    await redis.hincrby(`doc:${documentId}`, 'views', 1);

    const views = await redis.hget(`doc:${documentId}`, 'views');
    
    await redis.quit();

    return res.status(200).json({
      success: true,
      tracked: true,
      views: parseInt(views || '0')
    });

  } catch (error: any) {
    console.error('Erro ao rastrear visualização:', error);
    return res.status(500).json({
      error: 'Erro ao rastrear visualização',
      details: error.message
    });
  }
}
