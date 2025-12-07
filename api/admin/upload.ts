import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { put } from '@vercel/blob';

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

    const [fields, files] = await form.parse(req);
    
    const docxFile = files.document?.[0];
    if (!docxFile) {
      return res.status(400).json({ error: 'Arquivo não fornecido' });
    }

    // Validar extensão
    if (!docxFile.originalFilename?.endsWith('.docx')) {
      return res.status(400).json({ error: 'Apenas arquivos .docx são permitidos' });
    }

    // Ler o arquivo
    const buffer = fs.readFileSync(docxFile.filepath);

    // Converter para HTML (preview)
    const result = await mammoth.convertToHtml({ buffer });
    
    // Verificar se o token do Blob está configurado
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
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

    // Resposta
    return res.status(200).json({
      success: true,
      message: 'Documento enviado com sucesso!',
      filename: docxFile.originalFilename,
      size: docxFile.size,
      blobUrl: blob.url,
      preview: result.value.substring(0, 500) + '...', // Preview limitado
      note: 'Para processar o documento no sistema de busca, execute "npm run convert-docs" localmente e faça deploy.'
    });

  } catch (error: any) {
    console.error('Erro no upload:', error);
    return res.status(500).json({ 
      error: 'Erro ao processar upload', 
      details: error.message 
    });
  }
}
