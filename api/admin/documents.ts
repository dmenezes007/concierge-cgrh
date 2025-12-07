import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificar autenticação
  const authenticated = await isAuthenticated(req);
  if (!authenticated) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    // GET - Listar documentos
    if (req.method === 'GET') {
      const docsPath = path.join(process.cwd(), 'docs');
      
      if (!fs.existsSync(docsPath)) {
        return res.status(200).json({ documents: [] });
      }

      const files = fs.readdirSync(docsPath)
        .filter(file => file.endsWith('.docx'))
        .map(file => {
          const stats = fs.statSync(path.join(docsPath, file));
          return {
            name: file,
            size: stats.size,
            modified: stats.mtime,
            path: `/docs/${file}`
          };
        });

      return res.status(200).json({ 
        documents: files,
        count: files.length 
      });
    }

    // DELETE - Deletar documento
    if (req.method === 'DELETE') {
      const { filename } = req.query;
      
      if (!filename || typeof filename !== 'string') {
        return res.status(400).json({ error: 'Nome do arquivo é obrigatório' });
      }

      const filePath = path.join(process.cwd(), 'docs', filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }

      // Deletar arquivo
      fs.unlinkSync(filePath);

      return res.status(200).json({ 
        success: true,
        message: `Documento ${filename} deletado com sucesso` 
      });
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error: any) {
    console.error('Erro em documents:', error);
    return res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}
