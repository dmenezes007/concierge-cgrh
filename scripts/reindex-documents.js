/**
 * Re-indexar documentos do Blob Storage no Redis
 * Aplica novas regras de indexação: TODAS as palavras + formatação avançada preservada
 */

import { list } from '@vercel/blob';
import Redis from 'ioredis';
import mammoth from 'mammoth';
import dotenv from 'dotenv';
import { processDocx, sectionsToJson } from './docx-processor.js';

// Carregar variáveis de ambiente
dotenv.config();

async function reindexDocuments() {
  console.log('🔄 Iniciando re-indexação de documentos com formatação avançada...\n');

  // Conectar ao Redis
  const redis = new Redis(process.env.REDIS_URL || process.env.KV_REST_API_URL);

  try {
    // 1. Listar todos os blobs
    console.log('📋 Listando documentos no Blob Storage...');
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      prefix: 'docs/'
    });

    console.log(`Encontrados ${blobs.length} documentos\n`);

    // 2. Para cada blob, baixar, processar e re-indexar
    for (const blob of blobs) {
      try {
        const filename = blob.pathname.replace('docs/', '');
        
        if (!filename.endsWith('.docx')) {
          console.log(`⏭️  Ignorando ${filename} (não é .docx)`);
          continue;
        }

        console.log(`\n📄 Processando: ${filename}`);
        
        // Baixar o arquivo
        const response = await fetch(blob.url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Processar com formatação avançada
        console.log('   🔍 Extraindo formatação avançada...');
        const processed = await processDocx(buffer);
        const content = processed.content;
        const sectionsJson = sectionsToJson(processed.sections);

        console.log(`   ✅ ${processed.sections.length} seções estruturadas`);
        console.log(`   📊 ${processed.metadata.wordCount} palavras, ${processed.metadata.paragraphCount} parágrafos`);
        console.log(`   🔗 Links: ${processed.metadata.hasLinks ? 'Sim' : 'Não'}, Tabelas: ${processed.metadata.hasTables ? 'Sim' : 'Não'}`);

        // Gerar ID
        const title = filename.replace('.docx', '');
        const id = title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        console.log(`   ID: doc:${id}`);

        // Gerar keywords (TODAS as palavras únicas)
        const words = content
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter(w => w.length > 3);
        
        const uniqueWords = [...new Set(words)];
        const keywords = uniqueWords.join(' ');

        console.log(`   Palavras únicas: ${uniqueWords.length}`);
        console.log(`   Tamanho do conteúdo: ${content.length} caracteres`);

        // Atualizar no Redis com formatação preservada
        const documentData = {
          id,
          title,
          keywords,
          description: content, // Sem limite - conteúdo completo
          content,
          sections: sectionsJson, // Seções estruturadas com formatação
          icon: 'file-text',
          color: JSON.stringify({ bg: 'blue', text: 'white' }),
          externalLink: '',
          lastModified: blob.uploadedAt || new Date().toISOString(),
          createdAt: blob.uploadedAt || new Date().toISOString(),
          blobUrl: blob.url,
          metadata: JSON.stringify(processed.metadata)
        };

        await redis.hset(`doc:${id}`, ...Object.entries(documentData).flat());
        await redis.sadd('docs:all', id);

        // Limpar índices antigos deste documento
        console.log(`   🧹 Limpando índices antigos...`);
        const searchKeys = await redis.keys('search:*');
        for (const key of searchKeys) {
          await redis.srem(key, id);
        }

        // Re-indexar TODAS as palavras únicas
        console.log(`   🔍 Indexando ${uniqueWords.length} palavras...`);
        for (const word of uniqueWords) {
          if (word.length > 3) {
            await redis.sadd(`search:${word.toLowerCase()}`, id);
          }
        }

        console.log(`   ✅ Re-indexado com sucesso!`);

      } catch (error) {
        console.error(`   ❌ Erro ao processar ${blob.pathname}:`, error.message);
      }
    }

    console.log('\n\n✅ Re-indexação concluída!');
    console.log(`📊 Total de documentos processados: ${blobs.length}`);

  } catch (error) {
    console.error('❌ Erro durante re-indexação:', error);
    throw error;
  } finally {
    await redis.quit();
  }
}

// Executar
reindexDocuments().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
