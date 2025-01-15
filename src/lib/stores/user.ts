import { writable } from 'svelte/store';

export type User = {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
} | null;

export const currentUser = writable<User>(null);
