import { writable } from 'svelte/store';

// Initialize from localStorage if available
const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('soundMuted') : null;
const { subscribe, set, update } = writable<boolean>(stored === 'true');

// Create the store with localStorage sync
export const soundMuted = {
    subscribe,
    set: (value: boolean) => {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('soundMuted', value.toString());
        }
        set(value);
    },
    update
};
