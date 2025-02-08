import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";

export async function handle({ event, resolve }) {
    event.setHeaders({
        'Cache-Control': 'private, no-cache, no-store, must-revalidate'
    });

    return svelteKitHandler({ event, resolve, auth });
}