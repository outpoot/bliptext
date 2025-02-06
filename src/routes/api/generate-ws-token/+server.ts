import { auth } from '$lib/auth';
import { redis } from '$lib/server/redis';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    const token = crypto.randomUUID();

    const data = JSON.stringify({
        userId: session?.user?.id || null,
        ip: request.headers.get('cf-connecting-ip'),
        isBanned: session?.user?.isBanned || false
    });

    await redis.set(`ws:${token}`, data, 'EX', 300);

    return json(
        { token },
        {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        }
    );
};