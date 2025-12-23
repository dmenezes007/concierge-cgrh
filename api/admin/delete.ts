import type { VercelRequest, VercelResponse } from '@vercel/node';
import { del } from '@vercel/blob';
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
  res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar autenticação
  const authenticated = await isAuthenticated(req);
  if (!authenticated) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      console.error('❌ ID não fornecido ou inválido:', id);
      return res.status(400).json({ error: 'ID do documento não fornecido' });
    }

    console.log('🗑️ Deletando documento:', id);

    const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL;
    if (!redisUrl) {
      console.error('❌ Redis URL não configurada');
      return res.status(500).json({ error: 'Redis não configurado' });
    }

    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
      }
    });

    // 1. Buscar documento no Redis
    console.log('📋 Buscando documento no Redis...');
    const doc = await redis.hgetall(`doc:${id}`);
    
    if (!doc || !doc.id) {
      console.error('❌ Documento não encontrado:', id);
      await redis.quit();
      return res.status(404).json({ error: 'Documento não encontrado' });
    }

    console.log('✅ Documento encontrado:', doc.title || id);

    // 2. Deletar arquivo do Blob Storage (se existir)
    let blobDeleted = false;
    if (doc.blobUrl) {
      try {
        console.log('🗑️ Tentando deletar do Blob:', doc.blobUrl);
        
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          console.error('❌ BLOB_READ_WRITE_TOKEN não configurado - Blob não será deletado!');
          throw new Error('Token do Blob não configurado');
        }
        
        // Deletar do Blob
        await del(doc.blobUrl, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        
        blobDeleted = true;
        console.log('✅ Arquivo deletado do Blob Storage com sucesso');
        
      } catch (error: any) {
        console.error('❌ ERRO CRÍTICO ao deletar arquivo do Blob:', error.message);
        console.error('Stack completo:', error.stack);
        console.error('BlobUrl:', doc.blobUrl);
        console.error('Token presente:', !!process.env.BLOB_READ_WRITE_TOKEN);
        
        // NÃO continua - retorna erro para o usuário saber que falhou
        await redis.quit();
        return res.status(500).json({
          error: 'Erro ao deletar arquivo do Blob Storage',
          details: error.message,
          blobUrl: doc.blobUrl,
          warning: 'Documento removido do Redis mas arquivo permanece no Blob'
        });
      }
    } else {
      console.log('ℹ️ Documento não possui blobUrl, pulando deleção do Blob');
    }

    // 3. Remover índices de busca
    if (doc.keywords) {
      const keywords = doc.keywords.split(' ').filter((w: string) => w.length > 3);
      for (const keyword of keywords) {
        await redis.srem(`search:${keyword.toLowerCase()}`, id);
      }
      console.log('✅ Índices de busca removidos');
    }

    // 4. Remover documento do Redis
    await redis.del(`doc:${id}`);
    await redis.srem('docs:all', id);

    await redis.quit();

    console.log('✅ Documento deletado com sucesso:', id);

    return res.status(200).json({
      success: true,
      message: 'Documento deletado com sucesso',
      documentId: id,
      blobDeleted,
      details: {
        redisRemoved: true,
        blobRemoved: blobDeleted,
        searchIndexRemoved: true
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao deletar documento:', error);
    return res.status(500).json({
      error: 'Erro ao deletar documento',
      details: error.message
    });
  }
}
