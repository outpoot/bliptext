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

    console.error('Setting WS token data:', { token, data });

    // Set token with 5 minute expiry
    await redis.set(
        `ws:${token}`,
        data,
        'EX',
        300
    );

    // Verify it was set
    const verify = await redis.get(`ws:${token}`);
    console.error('Verification of token storage:', { token, stored: verify });

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