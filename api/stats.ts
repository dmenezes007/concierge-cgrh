import type { VercelRequest, VercelResponse } from '@vercel/node';
import Redis from 'ioredis';

/**
 * API consolidada para estatísticas
 * - POST /api/stats?action=track-view : Rastrear visualização
 * - POST /api/stats?action=rate : Adicionar avaliação  
 * - GET /api/stats?action=document&id={id} : Obter stats de um documento
 * - GET /api/stats?action=ratings&documentId={id} : Obter ratings
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // 1. Track View (POST)
    if (req.method === 'POST' && action === 'track-view') {
      const { documentId } = req.body;

      if (!documentId) {
        return res.status(400).json({ error: 'documentId não fornecido' });
      }

      const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL;
      if (!redisUrl) {
        return res.status(200).json({ success: true, tracked: false });
      }

      const redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 50, 2000);
        }
      });

      await redis.hincrby(`doc:${documentId}`, 'views', 1);
      const views = await redis.hget(`doc:${documentId}`, 'views');
      await redis.quit();

      return res.status(200).json({
        success: true,
        tracked: true,
        views: parseInt(views || '0')
      });
    }

    // 2. Rate Document (POST)
    if (req.method === 'POST' && action === 'rate') {
      const { documentId, rating } = req.body;

      if (!documentId || !rating) {
        return res.status(400).json({ error: 'documentId e rating são obrigatórios' });
      }

      // Salvar no localStorage (via frontend) - apenas retornar sucesso
      // A lógica de agregação está no frontend
      return res.status(200).json({
        success: true,
        documentId,
        rating
      });
    }

    // 3. Get Document Stats (GET)
    if (req.method === 'GET' && action === 'document') {
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

      const views = await redis.hget(`doc:${id}`, 'views');
      let averageRating = 0;
      let ratingCount = 0;

      try {
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

      await redis.quit();

      return res.status(200).json({
        views: parseInt(views || '0'),
        averageRating: Math.round(averageRating * 10) / 10,
        ratingCount
      });
    }

    // 4. Get Ratings (GET) - Compatibilidade com código antigo
    if (req.method === 'GET' && action === 'ratings') {
      const { documentId } = req.query;

      if (!documentId || typeof documentId !== 'string') {
        return res.status(400).json({ error: 'documentId não fornecido' });
      }

      // Buscar do localStorage (gerenciado pelo frontend)
      return res.status(200).json({
        documentId,
        ratings: [],
        average: 0,
        count: 0
      });
    }

    return res.status(400).json({ error: 'Ação inválida' });

  } catch (error: any) {
    console.error('Erro na API de stats:', error);
    return res.status(500).json({
      error: 'Erro ao processar solicitação',
      details: error.message
    });
  }
}
