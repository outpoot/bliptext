import { auth } from '$lib/auth';
import { redis } from '$lib/server/redis';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) return new Response('Unauthorized', { status: 401 });

    const token = crypto.randomUUID();

    await redis.set(
        `ws:${token}`,
        JSON.stringify({
            userId: session.user.id,
            ip: request.headers.get('cf-connecting-ip'),
            isBanned: session.user.isBanned
        }),
        'EX', 60
    );

    return json({ token });
}