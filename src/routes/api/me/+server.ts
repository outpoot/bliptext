import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';

export const GET: RequestHandler = async ({ request, cookies }) => {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })
        
        if(!session?.user) {
            throw new Error('Unauthorized');
        }

        return json({
            id: session?.user.id,
            name: session?.user.name,
            email: session?.user.email,
            image: session?.user.image
        });
    } catch (error) {
        console.log(error)
        return new Response('Unauthorized', { status: 401 });
    }
};
