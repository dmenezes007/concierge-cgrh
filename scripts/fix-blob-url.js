import Redis from 'ioredis';
import { list } from '@vercel/blob';
import dotenv from 'dotenv';

dotenv.config();

async function fixBlobUrl() {
  const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL;
  const redis = new Redis(redisUrl);
  
  const { blobs } = await list({
    prefix: 'docs/6',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  
  if (blobs.length > 0) {
    const blobUrl = blobs[0].url;
    console.log('Atualizando blobUrl:', blobUrl);
    await redis.hset('doc:6-entrevista-com-usuario---lgpd', 'blobUrl', blobUrl);
    console.log('✅ Atualizado!');
  }
  
  await redis.quit();
}

fixBlobUrl();
