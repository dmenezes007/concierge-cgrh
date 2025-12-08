import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Verificar variáveis de ambiente
    const checks = {
      BLOB_READ_WRITE_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
      ADMIN_PASSWORD_HASH: !!process.env.ADMIN_PASSWORD_HASH,
      KV_REST_API_URL: !!process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    };

    const tokenPrefix = process.env.BLOB_READ_WRITE_TOKEN 
      ? process.env.BLOB_READ_WRITE_TOKEN.substring(0, 20) + '...'
      : 'NOT SET';

    // Tentar importar e testar Blob
    let blobTest = 'NOT TESTED';
    try {
      const { list } = await import('@vercel/blob');
      const result = await list({
        prefix: 'docs/',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      blobTest = `SUCCESS - ${result.blobs.length} files found`;
    } catch (error: any) {
      blobTest = `ERROR - ${error.message}`;
    }

    return res.status(200).json({
      success: true,
      environmentVariables: checks,
      blobToken: tokenPrefix,
      blobStorageTest: blobTest,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
