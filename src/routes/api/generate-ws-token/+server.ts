import { auth } from '$lib/auth';
import { redis } from '$lib/server/redis';
import { json, type RequestHandler } from '@sveltejs/kit';
import pino from 'pino';

// Create a logger instance
const logger = pino({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
});

export const GET: RequestHandler = async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    const token = crypto.randomUUID();

    const data = JSON.stringify({
        userId: session?.user?.id || null,
        ip: request.headers.get('cf-connecting-ip'),
        isBanned: session?.user?.isBanned || false
    });

    logger.info({ token, data }, 'Setting WS token data');

    try {
        await redis.set(`ws:${token}`, data, 'EX', 300);
    } catch (error) {
        console.error('Redis set error:', error);
    }

    // Verify it was set
    const verify = await redis.get(`ws:${token}`);
    logger.info({ token, stored: verify }, 'Verification of token storage');

    // Add cache control headers
    return json(
        { token },
        {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        }
    );
};