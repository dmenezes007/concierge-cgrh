/**
 * Fazer upload de um arquivo específico para o Blob e indexar
 */

import { put } from '@vercel/blob';
import Redis from 'ioredis';
import mammoth from 'mammoth';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { processDocx, sectionsToJson } from './docx-processor.js';

// Carregar variáveis de ambiente
dotenv.config();

async function uploadSpecificFile(filename) {
  console.log(`🔄 Fazendo upload de: ${filename}\n`);

  const redis = new Redis(process.env.REDIS_URL || process.env.KV_REST_API_URL);

  try {
    const filePath = path.join(process.cwd(), 'docs', filename);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    // Ler o arquivo
    const buffer = fs.readFileSync(filePath);
    console.log(`📄 Arquivo lido: ${buffer.length} bytes`);

    // Processar com formatação avançada
    console.log('📖 Extraindo texto e formatação...');
    const processed = await processDocx(buffer);
    const content = processed.content;
    const sectionsJson = sectionsToJson(processed.sections);
    console.log(`   Conteúdo: ${content.length} caracteres`);
    console.log(`   Seções estruturadas: ${processed.sections.length}`);
    console.log(`   Formatação: Links=${processed.metadata.hasLinks}, Tabelas=${processed.metadata.hasTables}`);

    // Upload para Blob
    console.log('☁️  Fazendo upload para Blob Storage...');
    const blob = await put(`docs/${filename}`, buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    console.log(`   URL: ${blob.url}`);

    // Gerar ID
    const title = filename.replace('.docx', '');
    const id = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    console.log(`\n🔍 Indexando documento...`);
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

    // Salvar no Redis com formatação preservada
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
      lastModified: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      blobUrl: blob.url,
      metadata: JSON.stringify(processed.metadata)
    };

    await redis.hset(`doc:${id}`, ...Object.entries(documentData).flat());
    await redis.sadd('docs:all', id);

    // Indexar palavras
    console.log(`   🗂️  Indexando palavras no Redis...`);
    for (const word of uniqueWords) {
      if (word.length > 3) {
        await redis.sadd(`search:${word.toLowerCase()}`, id);
      }
    }

    console.log(`\n✅ Sucesso! Documento disponível para busca.`);
    console.log(`   Título: ${title}`);
    console.log(`   Blob URL: ${blob.url}`);
    console.log(`   Redis ID: doc:${id}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await redis.quit();
  }
}

// Executar
const filename = process.argv[2] || '6 ENTREVISTA COM USUÁRIO - LGPD.docx';
uploadSpecificFile(filename).catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
