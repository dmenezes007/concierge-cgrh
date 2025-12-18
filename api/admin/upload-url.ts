import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleUpload } from '@vercel/blob/client';

// Lazy load KV
let kv: any = null;
let kvInitialized = false;

async function getKV() {
  if (!kvInitialized) {
    kvInitialized = true;
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return null;
    }
    try {
      const kvModule = await import('@vercel/kv');
      kv = kvModule.kv;
    } catch (error) {
      return null;
    }
  }
  return kv;
}

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
      console.warn('KV check failed');
    }
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Vercel-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar se o token do Blob está configurado
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN não configurado');
      return res.status(500).json({
        error: 'Blob Storage não configurado',
        message: 'A variável BLOB_READ_WRITE_TOKEN não foi encontrada.'
      });
    }

    // Handle client upload request from @vercel/blob/client
    const jsonResponse = await handleUpload({
      body: req,
      request: req,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        console.log('Generating upload token for:', pathname);
        
        // Autenticação dentro do callback
        const authenticated = await isAuthenticated(req);
        if (!authenticated) {
          throw new Error('Não autorizado');
        }
        
        // Validate that it's a .docx file
        if (!pathname.endsWith('.docx')) {
          throw new Error('Apenas arquivos .docx são permitidos');
        }

        return {
          allowedContentTypes: [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/octet-stream'
          ],
          tokenPayload: JSON.stringify({
            pathname: `docs/${pathname}`,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed successfully:', blob.pathname);
      },
    });

    return res.status(200).json(jsonResponse);

  } catch (error: any) {
    console.error('Erro ao gerar URL de upload:', error);
    return res.status(500).json({ 
      error: 'Erro ao gerar URL de upload',
      details: error.message 
    });
  }
}
