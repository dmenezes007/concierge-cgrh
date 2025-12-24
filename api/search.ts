import { VercelRequest, VercelResponse } from '@vercel/node';
import Redis from 'ioredis';

// Criar cliente Redis
function createRedisClient() {
  const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL ou KV_REST_API_URL não configurada');
  }
  return new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 50, 2000);
    }
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redis = createRedisClient();

  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      await redis.quit();
      return res.status(400).json({ error: 'Parâmetro "q" é obrigatório' });
    }

    const query = q.toLowerCase().trim();
    console.log('🔍 API Search - Query:', query);

    // 1. Extrair palavras-chave da busca (remover acentos, normalizar)
    const searchWords = query
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2); // Aceitar palavras com 3+ caracteres

    console.log('🔑 Palavras da busca:', searchWords);

    if (searchWords.length === 0) {
      return res.status(200).json([]);
    }

    // 2. Buscar IDs dos documentos que contêm cada palavra
    const docIdSets = await Promise.all(
      searchWords.map(async word => {
        const ids = await redis.smembers(`search:${word}`);
        console.log(`  - "${word}": ${ids.length} docs`);
        return ids;
      })
    );

    // 3. Usar UNIÃO (OR) em vez de interseção - encontra docs com QUALQUER palavra
    const allIds = new Set<string>();
    docIdSets.forEach(set => {
      (set || []).forEach(id => allIds.add(id as string));
    });
    
    let matchingIds = Array.from(allIds);

    // Se encontrou poucos resultados, tentar buscar no título/keywords diretamente
    if (matchingIds.length < 5) {
      console.log('🔍 Buscando também por correspondência parcial em títulos...');
      const allDocIds = await redis.smembers('docs:all');
      
      for (const docId of allDocIds) {
        if (!matchingIds.includes(docId)) {
          const doc = await redis.hgetall(`doc:${docId}`);
          const titleNormalized = (doc.title || '').toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          
          // Verificar se alguma palavra da busca está no título
          const hasMatch = searchWords.some(word => titleNormalized.includes(word));
          if (hasMatch) {
            matchingIds.push(docId);
          }
        }
      }
    }

    console.log(`📊 Total de ${matchingIds.length} documentos encontrados`);

    // 4. Buscar dados completos dos documentos
    const documents = await Promise.all(
      matchingIds.map(async (id) => {
        const doc = await redis.hgetall(`doc:${id}`);
        // Parse sections back to object
        if (doc.sections && typeof doc.sections === 'string') {
          try {
            doc.sections = JSON.parse(doc.sections);
          } catch (e) {
            console.warn('Failed to parse sections for', id);
          }
        }
        return doc;
      })
    );

    // 5. Filtrar e ordenar por relevância
    const validDocs = documents.filter(doc => doc && doc.title);
    
    // Calcular score de relevância
    const scoredDocs = validDocs.map(doc => {
      let score = 0;
      const docText = `${doc.title} ${doc.keywords} ${doc.description}`.toLowerCase();
      
      searchWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        const matches = docText.match(regex);
        score += matches ? matches.length : 0;
      });
      
      return { ...doc, _score: score };
    });

    // Ordenar por score (maior primeiro)
    scoredDocs.sort((a, b) => b._score - a._score);

    // Remover o _score antes de retornar
    const results = scoredDocs.map(({ _score, ...doc }) => doc);

    await redis.quit();

    return res.status(200).json(results);

  } catch (error: any) {
    console.error('❌ Erro na busca:', error);
    await redis.quit();
    return res.status(500).json({
      error: 'Erro ao buscar documentos',
      details: error.message
    });
  }
}
