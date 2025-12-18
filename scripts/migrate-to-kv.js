#!/usr/bin/env node

/**
 * Script de Migração - Database.json → Vercel KV
 * 
 * Migra todos os documentos existentes no database.json para o Vercel KV,
 * criando índices de busca para cada documento.
 */

import 'dotenv/config';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar cliente Redis direto
const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL;
if (!redisUrl) {
  console.error('❌ REDIS_URL ou KV_REST_API_URL não configurada');
  process.exit(1);
}

console.log('🔗 Conectando ao Redis:', redisUrl.replace(/:[^:@]+@/, ':****@'));
const redis = new Redis(redisUrl);

// Funções compatíveis com @vercel/kv
const kv = {
  async hset(key, data) {
    const entries = Object.entries(data).flat();
    return redis.hset(key, ...entries);
  },
  async sadd(key, ...members) {
    return redis.sadd(key, ...members);
  },
  async hgetall(key) {
    return redis.hgetall(key);
  },
  async smembers(key) {
    return redis.smembers(key);
  }
};

// Carregar database.json
const databasePath = path.join(__dirname, '..', 'src', 'database.json');
console.log('📂 Carregando database.json...');

if (!fs.existsSync(databasePath)) {
  console.error('❌ Arquivo database.json não encontrado em:', databasePath);
  process.exit(1);
}

const database = JSON.parse(fs.readFileSync(databasePath, 'utf-8'));
console.log(`✅ ${database.length} documentos carregados\n`);

// Função auxiliar para extrair texto de seções
function extractText(sections) {
  return sections
    .map(section => {
      if (section.type === 'paragraph' || section.type === 'heading') {
        return section.content || '';
      }
      if (section.type === 'list') {
        return section.items?.map(item => item.text || '').join(' ') || '';
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

// Função para gerar palavras-chave de busca
function generateSearchWords(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

async function migrateDocuments() {
  console.log('🚀 Iniciando migração para Vercel KV...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const doc of database) {
    try {
      console.log(`📄 Migrando: ${doc.title}`);

      // Extrair conteúdo completo
      const content = extractText(doc.sections || []);

      // Preparar dados do documento (serializar objetos complexos)
      const documentData = {
        id: doc.id,
        title: doc.title || '',
        keywords: doc.keywords || '',
        description: doc.description || '',
        content,
        sections: JSON.stringify(doc.sections || []),
        icon: doc.icon || 'file-text',
        color: JSON.stringify(doc.color || {}),
        externalLink: doc.externalLink || '',
        lastModified: doc.lastModified || '',
        createdAt: new Date().toISOString(),
      };

      // 1. Salvar documento no KV
      await kv.hset(`doc:${doc.id}`, documentData);
      console.log(`   ✓ Documento salvo: doc:${doc.id}`);

      // 2. Adicionar à lista de todos os documentos
      await kv.sadd('docs:all', doc.id);
      console.log(`   ✓ Adicionado à lista docs:all`);

      // 3. Criar índices de busca
      const searchText = `${doc.title} ${doc.keywords} ${content}`;
      const searchWords = [...new Set(generateSearchWords(searchText))];
      
      console.log(`   ℹ Indexando ${searchWords.length} palavras-chave...`);
      
      // Indexar palavras (em lotes para performance)
      const batchSize = 50;
      for (let i = 0; i < searchWords.length; i += batchSize) {
        const batch = searchWords.slice(i, i + batchSize);
        await Promise.all(
          batch.map(word => kv.sadd(`search:${word}`, doc.id))
        );
      }
      
      console.log(`   ✅ Indexado com sucesso!\n`);
      successCount++;

    } catch (error) {
      console.error(`   ❌ Erro ao migrar "${doc.title}":`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMO DA MIGRAÇÃO');
  console.log('='.repeat(50));
  console.log(`✅ Sucesso: ${successCount} documentos`);
  console.log(`❌ Erros: ${errorCount} documentos`);
  console.log(`📚 Total: ${database.length} documentos`);
  console.log('='.repeat(50) + '\n');

  // Fechar conexão Redis
  await redis.quit();
  console.log('🔌 Conexão fechada');

  if (errorCount === 0) {
    console.log('🎉 Migração concluída com sucesso!\n');
    console.log('Para testar, faça uma busca no concierge-cgrh.');
    console.log('Os documentos agora estão disponíveis instantaneamente após upload.\n');
  } else {
    console.log('⚠️ Migração concluída com alguns erros.\n');
  }
}

// Executar migração
migrateDocuments()
  .then(() => {
    console.log('✨ Script finalizado');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
