import { writable } from 'svelte/store';

export type User = {
    id: string;
    name: string;
    email: string;
    image: string;
} | null;

export const currentUser = writable<User>(null);
