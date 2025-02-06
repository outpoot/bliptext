import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";

export async function handle({ event, resolve }) {
    event.setHeaders({
        'cache-control': 'private, no-cache, no-store, must-revalidate'
    });
    return svelteKitHandler({ event, resolve, auth });
}