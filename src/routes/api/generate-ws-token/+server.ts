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

    console.log('Setting WS token data:', { token, data });

    await redis.set(
        `ws:${token}`,
        data,
        'EX',
        300 // increased to 5 minutes for testing
    );

    // Verify it was set
    const verify = await redis.get(`ws:${token}`);
    console.log('Verification of token storage:', { token, stored: verify });

    return json({ token });
};