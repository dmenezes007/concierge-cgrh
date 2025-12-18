import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis(process.env.REDIS_URL);

const query = process.argv[2] || 'aposentadoria';

console.log(`🔍 Buscando: "${query}"\n`);

// Normalizar query
const searchWords = query
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .split(/\s+/)
  .filter(w => w.length > 2);

console.log(`📝 Palavras de busca:`, searchWords);

// Buscar IDs
const docIdSets = await Promise.all(
  searchWords.map(word => redis.smembers(`search:${word}`))
);

console.log(`\n📊 Resultados por palavra:`);
searchWords.forEach((word, i) => {
  console.log(`  ${word}: ${docIdSets[i].length} documentos`);
});

// Interseção
let matchingIds = docIdSets[0] || [];
for (let i = 1; i < docIdSets.length; i++) {
  const set = docIdSets[i] || [];
  matchingIds = matchingIds.filter(id => set.includes(id));
}

console.log(`\n✅ Documentos encontrados (interseção): ${matchingIds.length}`);
console.log(matchingIds);

// Buscar detalhes
if (matchingIds.length > 0) {
  console.log(`\n📄 Detalhes dos documentos:\n`);
  for (const id of matchingIds) {
    const doc = await redis.hgetall(`doc:${id}`);
    console.log(`- ${doc.title} (${id})`);
    console.log(`  Keywords: ${doc.keywords?.substring(0, 100)}...`);
  }
}

await redis.quit();
