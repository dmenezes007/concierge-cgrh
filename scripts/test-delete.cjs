require('dotenv').config();
const Redis = require('ioredis');

async function testDelete() {
  const redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 50, 2000);
    }
  });

  try {
    console.log('🔗 Conectado ao Redis\n');

    // Listar todos os documentos
    const docIds = await redis.smembers('docs:all');
    console.log(`📚 Documentos encontrados: ${docIds.length}`);
    
    if (docIds.length === 0) {
      console.log('⚠️  Nenhum documento para deletar');
      await redis.quit();
      return;
    }

    console.log('Documentos:', docIds);
    console.log('');

    // Pegar o primeiro documento como exemplo
    const testId = docIds[0];
    console.log(`🗑️  Testando deleção do documento: ${testId}`);

    // Buscar dados do documento
    const doc = await redis.hgetall(`doc:${testId}`);
    console.log('Dados do documento:');
    console.log('  - ID:', doc.id);
    console.log('  - Title:', doc.title);
    console.log('  - BlobUrl:', doc.blobUrl || '(não definido)');
    console.log('  - Keywords:', doc.keywords ? doc.keywords.substring(0, 50) + '...' : '(não definido)');
    console.log('');

    // Simular processo de deleção
    console.log('📋 Processo de deleção:');

    // 1. Remover índices de busca
    if (doc.keywords) {
      const keywords = doc.keywords.split(' ').filter(w => w.length > 3);
      console.log(`  1. Removendo ${keywords.length} índices de busca...`);
      for (const keyword of keywords) {
        await redis.srem(`search:${keyword.toLowerCase()}`, testId);
      }
      console.log('     ✅ Índices removidos');
    }

    // 2. Remover documento
    console.log('  2. Removendo documento do Redis...');
    await redis.del(`doc:${testId}`);
    console.log('     ✅ Documento removido');

    // 3. Remover da lista
    console.log('  3. Removendo da lista docs:all...');
    await redis.srem('docs:all', testId);
    console.log('     ✅ Removido da lista');

    console.log('');
    console.log('✅ Teste de deleção completo!');
    console.log('');

    // Verificar resultado
    const remainingDocs = await redis.smembers('docs:all');
    console.log(`📊 Documentos restantes: ${remainingDocs.length}`);
    console.log('Restantes:', remainingDocs);

    await redis.quit();

  } catch (error) {
    console.error('❌ Erro:', error.message);
    await redis.quit();
    process.exit(1);
  }
}

testDelete();
