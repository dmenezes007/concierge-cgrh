/**
 * Script para verificar sincronização entre docs/, Redis e Blob Storage
 * 
 * Uso: node scripts/check-sync-status.js
 */

import { list } from '@vercel/blob';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkSyncStatus() {
  console.log('\n🔍 VERIFICANDO SINCRONIZAÇÃO DE DOCUMENTOS\n');
  console.log('='.repeat(60));

  // 1. Verificar arquivos locais (docs/)
  console.log('\n📁 Arquivos Locais (docs/):');
  const docsPath = path.join(__dirname, '../docs');
  const localFiles = fs.readdirSync(docsPath)
    .filter(file => file.endsWith('.docx'))
    .map(file => file.replace('.docx', ''));
  
  console.log(`   Total: ${localFiles.length} arquivos`);
  localFiles.forEach(file => console.log(`   - ${file}.docx`));

  // 2. Verificar Blob Storage
  console.log('\n☁️  Blob Storage:');
  let blobFiles = [];
  
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({
        prefix: 'docs/',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      
      blobFiles = blobs.map(blob => blob.pathname.replace('docs/', '').replace('.docx', ''));
      console.log(`   Total: ${blobFiles.length} arquivos`);
      blobFiles.forEach(file => console.log(`   - ${file}.docx`));
    } catch (error) {
      console.log('   ⚠️  Erro ao acessar Blob Storage:', error.message);
    }
  } else {
    console.log('   ⚠️  BLOB_READ_WRITE_TOKEN não configurado');
  }

  // 3. Verificar Redis
  console.log('\n🗄️  Redis (Documentos Indexados):');
  let redisFiles = [];
  
  const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL;
  
  if (redisUrl) {
    try {
      const redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 50, 2000);
        }
      });
      
      const docIds = await redis.smembers('docs:all');
      redisFiles = docIds;
      
      console.log(`   Total: ${redisFiles.length} documentos`);
      
      for (const id of docIds) {
        const doc = await redis.hgetall(`doc:${id}`);
        console.log(`   - ${doc.title || id} (ID: ${id})`);
      }
      
      await redis.quit();
    } catch (error) {
      console.log('   ⚠️  Erro ao acessar Redis:', error.message);
    }
  } else {
    console.log('   ⚠️  Redis URL não configurada');
  }

  // 4. Análise de Sincronização
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 ANÁLISE DE SINCRONIZAÇÃO:\n');

  // Arquivos apenas no local
  const onlyLocal = localFiles.filter(file => {
    const normalized = file.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return !redisFiles.includes(normalized) && !blobFiles.includes(file);
  });

  // Arquivos apenas no Blob
  const onlyBlob = blobFiles.filter(file => {
    const normalized = file.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return !redisFiles.includes(normalized);
  });

  // Arquivos no Redis mas não no Blob
  const redisWithoutBlob = redisFiles.filter(id => {
    return !blobFiles.some(file => {
      const normalized = file.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return normalized === id;
    });
  });

  if (onlyLocal.length > 0) {
    console.log('⚠️  Arquivos APENAS no local (docs/):');
    onlyLocal.forEach(file => console.log(`   - ${file}.docx`));
    console.log('\n   → Ação: Fazer upload via painel admin ou executar convert-docs\n');
  }

  if (onlyBlob.length > 0) {
    console.log('⚠️  Arquivos no Blob mas NÃO indexados no Redis:');
    onlyBlob.forEach(file => console.log(`   - ${file}.docx`));
    console.log('\n   → Ação: Reprocessar com convert-docs ou fazer upload novamente\n');
  }

  if (redisWithoutBlob.length > 0) {
    console.log('⚠️  Documentos no Redis mas arquivo NÃO está no Blob:');
    redisWithoutBlob.forEach(id => console.log(`   - ${id}`));
    console.log('\n   → Ação: Re-upload do arquivo ou deletar do Redis\n');
  }

  if (onlyLocal.length === 0 && onlyBlob.length === 0 && redisWithoutBlob.length === 0) {
    console.log('✅ TUDO SINCRONIZADO!');
    console.log('\n   Todos os arquivos estão:');
    console.log('   - No Blob Storage (arquivos físicos)');
    console.log('   - No Redis (indexados para busca)');
    console.log('\n   ✨ Você pode LIMPAR os arquivos .docx da pasta docs/');
    console.log('   💡 Mantenha apenas a planilha Excel e crie um .gitkeep');
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

checkSyncStatus().catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
