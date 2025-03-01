import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { redirect } from "@sveltejs/kit";

export async function handle({ event, resolve }) {
    event.setHeaders({
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
    });

    // Stinky linux users don't deserve to be on the site ;)
    const userAgent = event.request.headers.get('user-agent') || '';
    console.log(userAgent);
    if (userAgent.toLowerCase().includes('linux') && !event.url.pathname.includes('/api/')) {
        throw redirect(301, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    }

    return svelteKitHandler({ event, resolve, auth });
}