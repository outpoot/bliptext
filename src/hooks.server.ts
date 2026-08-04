import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export async function handle({ event, resolve }) {
    const response = await svelteKitHandler({ event, resolve, auth });
    if (!response.headers.has('Cache-Control')) {
        const headers = new Headers(response.headers);
        headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
        });
    }
    return response;
}
