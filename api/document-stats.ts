import type { VercelRequest, VercelResponse } from '@vercel/node';
import Redis from 'ioredis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'ID não fornecido' });
    }

    const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL;
    if (!redisUrl) {
      return res.status(200).json({
        views: 0,
        averageRating: 0,
        ratingCount: 0
      });
    }

    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
      }
    });

    // Buscar visualizações do documento
    const views = await redis.hget(`doc:${id}`, 'views');

    // Buscar avaliações do documento
    let averageRating = 0;
    let ratingCount = 0;

    try {
      // Tentar buscar do Redis primeiro
      const ratingsData = await redis.hget(`doc:${id}`, 'ratings');
      if (ratingsData) {
        const ratings = JSON.parse(ratingsData);
        if (Array.isArray(ratings) && ratings.length > 0) {
          averageRating = ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length;
          ratingCount = ratings.length;
        }
      }
    } catch (e) {
      console.warn('Erro ao parsear ratings do Redis');
    }

    // Se não encontrou no Redis, tentar localStorage (via API de ratings)
    if (ratingCount === 0) {
      try {
        const ratingsResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/ratings?documentId=${id}`);
        if (ratingsResponse.ok) {
          const ratingsData = await ratingsResponse.json();
          averageRating = ratingsData.average || 0;
          ratingCount = ratingsData.count || 0;
        }
      } catch (e) {
        // Silenciar erro de fetch
      }
    }

    await redis.quit();

    return res.status(200).json({
      views: parseInt(views || '0'),
      averageRating: Math.round(averageRating * 10) / 10,
      ratingCount
    });

  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      error: 'Erro ao buscar estatísticas',
      details: error.message
    });
  }
}
