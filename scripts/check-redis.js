import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis(process.env.REDIS_URL);

console.log('🔗 Conectado ao Redis');

// Listar todas as chaves de documentos
const docKeys = await redis.keys('doc:*');
console.log(`\n📚 Documentos encontrados: ${docKeys.length}`);
docKeys.forEach(key => console.log(`  - ${key}`));

// Listar todas as chaves de busca
const searchKeys = await redis.keys('search:*');
console.log(`\n🔍 Índices de busca: ${searchKeys.length}`);
console.log('Primeiros 10:', searchKeys.slice(0, 10));

// Verificar lista de todos os docs
const allDocs = await redis.smembers('docs:all');
console.log(`\n📋 Lista docs:all: ${allDocs.length} documentos`);
console.log(allDocs);

// Pegar um documento exemplo
if (docKeys.length > 0) {
  console.log(`\n📄 Exemplo de documento (${docKeys[0]}):`);
  const doc = await redis.hgetall(docKeys[0]);
  console.log(JSON.stringify(doc, null, 2));
}

await redis.quit();
console.log('\n✅ Conexão fechada');
