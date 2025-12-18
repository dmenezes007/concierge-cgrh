import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { put } from '@vercel/blob';
import Redis from 'ioredis';

// Tentar importar KV de forma lazy
let kv: any = null;
let kvInitialized = false;

async function getKV() {
  if (!kvInitialized) {
    kvInitialized = true;
    
    // Verificar se as variáveis de ambiente do KV existem
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.log('Vercel KV not configured - using token-only authentication');
      return null;
    }
    
    try {
      const kvModule = await import('@vercel/kv');
      kv = kvModule.kv;
      console.log('Vercel KV initialized successfully');
    } catch (error) {
      console.warn('Error loading Vercel KV:', error);
      return null;
    }
  }
  return kv;
}

export const config = {
  api: {
    bodyParser: false,
  },
};

// Middleware para verificar autenticação
async function isAuthenticated(req: VercelRequest): Promise<boolean> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.split(' ')[1];

  const kvInstance = await getKV();
  if (kvInstance) {
    try {
      const session = await kvInstance.get(`admin_session:${token}`);
      return !!session;
    } catch (error) {
      console.warn('Erro ao validar token no KV');
    }
  }
  
  // Sem KV, aceitar qualquer token UUID válido
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar autenticação
  const authenticated = await isAuthenticated(req);
  if (!authenticated) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    // Parse do formulário com formidable
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    console.log('Parseando formulário...');
    const [fields, files] = await form.parse(req);
    console.log('Formulário parseado. Files:', Object.keys(files));
    
    const docxFile = files.document?.[0];
    if (!docxFile) {
      console.error('Nenhum arquivo recebido');
      return res.status(400).json({ error: 'Arquivo não fornecido' });
    }

    console.log('Arquivo recebido:', docxFile.originalFilename, 'Tamanho:', docxFile.size);

    // Validar extensão
    if (!docxFile.originalFilename?.endsWith('.docx')) {
      console.error('Extensão inválida:', docxFile.originalFilename);
      fs.unlinkSync(docxFile.filepath);
      return res.status(400).json({ error: 'Apenas arquivos .docx são permitidos' });
    }

    // Ler o arquivo
    console.log('Lendo arquivo...');
    const buffer = fs.readFileSync(docxFile.filepath);
    console.log('Arquivo lido, tamanho do buffer:', buffer.length);

    // Converter para HTML (preview)
    console.log('Convertendo para HTML...');
    const result = await mammoth.convertToHtml({ buffer });
    console.log('Conversão concluída');
    
    // Verificar se o token do Blob está configurado
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN não configurado');
      fs.unlinkSync(docxFile.filepath);
      return res.status(500).json({
        error: 'Blob Storage não configurado',
        message: 'A variável BLOB_READ_WRITE_TOKEN não foi encontrada. Configure o Vercel Blob Storage.'
      });
    }

    // Salvar no Vercel Blob Storage
    console.log(`Salvando arquivo no Blob: docs/${docxFile.originalFilename}`);
    const blob = await put(`docs/${docxFile.originalFilename}`, buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Limpar arquivo temporário do formidable
    fs.unlinkSync(docxFile.filepath);

    console.log('Arquivo salvo no Blob com sucesso:', blob.url);

    // 🔄 PROCESSAMENTO AUTOMÁTICO INLINE (sem chamada HTTP)
    try {
      console.log('🔄 Processando e indexando documento...');
      
      const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL;
      if (!redisUrl) {
        throw new Error('Redis não configurado');
      }

      const redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) return null;
          return Math.min(times * 50, 2000);
        }
      });

      // Extrair título e gerar ID
      const title = docxFile.originalFilename.replace('.docx', '');
      const id = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Extrair texto do HTML
      const content = result.value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      // Gerar keywords (top 20 palavras)
      const words = content
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3);
      
      const freq: Record<string, number> = {};
      words.forEach(w => freq[w] = (freq[w] || 0) + 1);
      
      const keywords = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word]) => word)
        .join(' ');

      // Salvar no Redis
      const documentData = {
        id,
        title,
        keywords,
        description: content.substring(0, 200),
        content,
        sections: '[]',
        icon: 'file-text',
        color: JSON.stringify({ bg: 'blue', text: 'white' }),
        externalLink: '',
        createdAt: new Date().toISOString(),
        blobUrl: blob.url
      };

      await redis.hset(`doc:${id}`, ...Object.entries(documentData).flat());
      await redis.sadd('docs:all', id);

      // Indexar palavras-chave
      const indexWords = keywords.split(' ').filter(w => w.length > 3);
      for (const word of indexWords) {
        await redis.sadd(`search:${word.toLowerCase()}`, id);
      }

      await redis.quit();

      console.log('✅ Documento indexado:', id);

      return res.status(200).json({
        success: true,
        message: '✅ Documento enviado e indexado automaticamente! Já está disponível para busca.',
        filename: docxFile.originalFilename,
        size: docxFile.size,
        blobUrl: blob.url,
        documentId: id,
        preview: result.value.substring(0, 500) + '...',
      });

    } catch (processError: any) {
      console.error('⚠️ Erro no processamento:', processError);
      
      return res.status(200).json({
        success: true,
        message: '⚠️ Documento enviado mas não indexado. Erro: ' + processError.message,
        filename: docxFile.originalFilename,
        size: docxFile.size,
        blobUrl: blob.url,
        preview: result.value.substring(0, 500) + '...',
      });
    }

  } catch (error: any) {
    console.error('Erro no upload:', error);
    console.error('Stack:', error.stack);
    return res.status(500).json({ 
      error: 'Erro ao processar upload', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
