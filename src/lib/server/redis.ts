import Redis from 'ioredis';
import { env } from '$env/dynamic/private';

const redis = new Redis(env.REDIS_URL!);

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redis.on('connect', () => {
    console.log('Redis connected successfully');
});

export { redis };
