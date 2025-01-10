import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyAuthJWT } from '$lib/server/jwt';

export const GET: RequestHandler = async ({ request, cookies }) => {
    const authHeader = request.headers.get('Authorization');
    const cookieToken = cookies.get('_TOKEN__DO_NOT_SHARE');

    const token = authHeader ? authHeader.replace('Bearer ', '') : cookieToken;

    if (!token) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const { payload, user } = await verifyAuthJWT(token);

        if (!payload || payload.exp < new Date().getTime()) {
            return new Response('Token expired', { status: 401 });
        }

        return json({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image
        });
    } catch (error) {
        return new Response('Invalid token', { status: 401 });
    }
};
