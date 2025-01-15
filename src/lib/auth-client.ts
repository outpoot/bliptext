import { createAuthClient } from "better-auth/svelte";
import { PUBLIC_BETTER_AUTH_URL } from '$env/static/public';

export const client = createAuthClient({
    baseURL: PUBLIC_BETTER_AUTH_URL,
});

export const { signIn, signUp, getSession } = client;