import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserFromRequest } from '$lib/server/jwt';

export const GET: RequestHandler = async ({ request, cookies }) => {
    try {
        const user = await getUserFromRequest(request, cookies);
        return json({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image
        });
    } catch (error) {
        return new Response('Unauthorized', { status: 401 });
    }
};
