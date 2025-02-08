import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";

export async function handle({ event, resolve }) {
    const path = event.url.pathname;
    if (path.startsWith('/images/') || path.startsWith('/fonts/')) {
        event.setHeaders({
            'Cache-Control': 'public, max-age=31536000, immutable'
        });
    } else {
        event.setHeaders({
            'Cache-Control': 'private, no-cache, no-store, must-revalidate'
        });
    }

    return svelteKitHandler({ event, resolve, auth });
}