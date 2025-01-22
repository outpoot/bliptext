import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

try {
	const { env } = await import('$env/dynamic/private');
	process.env.REDIS_URL = env.REDIS_URL;
	process.env.REDIS_TOKEN = env.REDIS_TOKEN;
} catch {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	dotenv.config({ path: path.join(__dirname, '../../../.env') });
}

const redis = new Redis({
	url: process.env.REDIS_URL,
	token: process.env.REDIS_TOKEN
});

export { redis };
