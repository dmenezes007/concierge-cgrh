import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RatingData {
  documentId: string;
  rating: number;
  timestamp: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { documentId } = req.query;

  try {
    // GET: Buscar avaliações de um documento
    if (req.method === 'GET' && documentId) {
      const ratingsKey = `ratings:${documentId}`;
      const ratings = await kv.lrange(ratingsKey, 0, -1) as number[];
      
      if (!ratings || ratings.length === 0) {
        return res.status(200).json({
          documentId,
          ratings: [],
          average: 0,
          count: 0
        });
      }

      const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      
      return res.status(200).json({
        documentId,
        ratings,
        average: Math.round(average * 10) / 10,
        count: ratings.length
      });
    }

    // POST: Adicionar nova avaliação
    if (req.method === 'POST') {
      const { documentId: docId, rating } = req.body as { documentId: string; rating: number };

      if (!docId || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'documentId e rating (1-5) são obrigatórios' });
      }

      const ratingsKey = `ratings:${docId}`;
      
      // Adicionar rating à lista
      await kv.lpush(ratingsKey, rating);
      
      // Buscar todas as avaliações atualizadas
      const allRatings = await kv.lrange(ratingsKey, 0, -1) as number[];
      const average = allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length;

      return res.status(201).json({
        documentId: docId,
        ratings: allRatings,
        average: Math.round(average * 10) / 10,
        count: allRatings.length
      });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de ratings:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
