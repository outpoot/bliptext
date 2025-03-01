import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { redirect } from "@sveltejs/kit";

export async function handle({ event, resolve }) {
    event.setHeaders({
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
    });

    const userAgent = event.request.headers.get('user-agent') || '';
    const isLinux = userAgent.toLowerCase().includes('linux');
    const isAndroid = userAgent.toLowerCase().includes('android');
    
    if (isLinux && !isAndroid && !event.url.pathname.includes('/api/')) {
        throw redirect(301, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    }

    return svelteKitHandler({ event, resolve, auth });
}