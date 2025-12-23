/**
 * Script para migrar TODOS os arquivos .docx da pasta docs/ para o Blob Storage
 * e atualizar as referências no Redis
 * 
 * Uso: node scripts/migrate-files-to-blob.js
 */

import { put } from '@vercel/blob';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrateFilesToBlob() {
  console.log('\n🚀 MIGRAÇÃO COMPLETA PARA BLOB STORAGE\n');
  console.log('='.repeat(60));

  // Verificar token do Blob
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('\n❌ BLOB_READ_WRITE_TOKEN não configurado no .env');
    console.error('Configure o token antes de continuar.\n');
    process.exit(1);
  }

  // Conectar ao Redis
  const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL;
  if (!redisUrl) {
    console.error('\n❌ Redis URL não configurada');
    process.exit(1);
  }

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 50, 2000);
    }
  });

  console.log('✅ Conectado ao Redis\n');

  // Listar arquivos da pasta docs/
  const docsPath = path.join(__dirname, '../docs');
  const files = fs.readdirSync(docsPath)
    .filter(file => file.endsWith('.docx'));

  console.log(`📁 Encontrados ${files.length} arquivos .docx na pasta docs/\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const filename of files) {
    try {
      console.log(`📤 Processando: ${filename}`);
      
      // Ler arquivo
      const filePath = path.join(docsPath, filename);
      const buffer = fs.readFileSync(filePath);
      const fileSize = (buffer.length / (1024 * 1024)).toFixed(2);
      
      console.log(`   Tamanho: ${fileSize} MB`);

      // Upload para Blob Storage
      console.log(`   ☁️  Fazendo upload para Blob Storage...`);
      const blob = await put(`docs/${filename}`, buffer, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      console.log(`   ✅ Upload concluído: ${blob.url}`);

      // Gerar ID do documento (mesmo algoritmo do upload.ts)
      const docId = filename
        .replace('.docx', '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Verificar se documento existe no Redis
      const exists = await redis.exists(`doc:${docId}`);
      
      if (exists) {
        // Atualizar blobUrl no Redis
        console.log(`   🔄 Atualizando blobUrl no Redis (doc:${docId})...`);
        await redis.hset(`doc:${docId}`, 'blobUrl', blob.url);
        console.log(`   ✅ Redis atualizado com blobUrl`);
      } else {
        console.log(`   ℹ️  Documento não existe no Redis (será criado no próximo upload via painel)`);
      }

      successCount++;
      console.log(`   ✨ ${filename} migrado com sucesso!\n`);

    } catch (error) {
      errorCount++;
      const errorMsg = `${filename}: ${error.message}`;
      errors.push(errorMsg);
      console.error(`   ❌ Erro ao migrar ${filename}:`, error.message);
      console.log('');
    }
  }

  await redis.quit();

  // Resumo
  console.log('='.repeat(60));
  console.log('\n📊 RESUMO DA MIGRAÇÃO\n');
  console.log(`✅ Sucesso: ${successCount} arquivos`);
  console.log(`❌ Erros: ${errorCount} arquivos`);
  console.log(`📚 Total: ${files.length} arquivos\n`);

  if (errors.length > 0) {
    console.log('❌ Erros encontrados:');
    errors.forEach(err => console.log(`   - ${err}`));
    console.log('');
  }

  if (successCount === files.length) {
    console.log('🎉 MIGRAÇÃO COMPLETA COM SUCESSO!\n');
    console.log('📋 Próximos passos:');
    console.log('   1. Verifique a sincronização: node scripts/check-sync-status.js');
    console.log('   2. Teste a busca e download na aplicação');
    console.log('   3. Após confirmar que tudo funciona:');
    console.log('      - Mantenha apenas a planilha Excel em docs/');
    console.log('      - Delete os arquivos .docx de docs/');
    console.log('      - Crie um arquivo .gitkeep em docs/ para manter a pasta no git');
    console.log('');
  } else {
    console.log('⚠️  Alguns arquivos falharam na migração.');
    console.log('    Revise os erros acima e tente novamente.\n');
  }

  console.log('='.repeat(60) + '\n');
}

migrateFilesToBlob().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
