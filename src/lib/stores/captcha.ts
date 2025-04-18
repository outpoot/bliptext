import { writable } from 'svelte/store';

export const captchaToken = writable<string | null>(null);
export const captchaVerified = writable(false);