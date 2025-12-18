import { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Parâmetro "q" é obrigatório' });
    }

    const query = q.toLowerCase().trim();
    console.log('🔍 Buscando:', query);

    // 1. Extrair palavras-chave da busca (remover acentos, normalizar)
    const searchWords = query
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    if (searchWords.length === 0) {
      return res.status(200).json([]);
    }

    // 2. Buscar IDs dos documentos que contêm cada palavra
    const docIdSets = await Promise.all(
      searchWords.map(word => kv.smembers(`search:${word}`))
    );

    // 3. Fazer interseção dos conjuntos (documentos que contêm TODAS as palavras)
    let matchingIds = docIdSets[0] || [];
    for (let i = 1; i < docIdSets.length; i++) {
      const set = docIdSets[i] || [];
      matchingIds = matchingIds.filter(id => set.includes(id));
    }

    // Se não encontrou com todas as palavras, tentar com união (qualquer palavra)
    if (matchingIds.length === 0) {
      const allIds = new Set<string>();
      docIdSets.forEach(set => {
        (set || []).forEach(id => allIds.add(id as string));
      });
      matchingIds = Array.from(allIds);
    }

    console.log(`📊 Encontrados ${matchingIds.length} documentos`);

    // 4. Buscar dados completos dos documentos
    const documents = await Promise.all(
      matchingIds.map(async (id) => {
        const doc = await kv.hgetall(`doc:${id}`);
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

    return res.status(200).json(results);

  } catch (error: any) {
    console.error('❌ Erro na busca:', error);
    return res.status(500).json({
      error: 'Erro ao buscar documentos',
      details: error.message
    });
  }
}
