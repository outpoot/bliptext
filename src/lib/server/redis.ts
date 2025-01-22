import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

try {
    const { env } = await import('$env/dynamic/private');
    process.env.REDIS_URL = env.REDIS_URL;
} catch {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    dotenv.config({ path: path.join(__dirname, "../../../.env") });
}

const redis = new Redis(process.env.REDIS_URL!);

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redis.on('connect', () => {
    console.log('Redis connected successfully');
});

export { redis };