import { writable } from 'svelte/store';

const storedValue = typeof window !== 'undefined' ? localStorage.getItem('editor_tos_accepted') : null;
export const tosAccepted = writable(storedValue === 'true');

tosAccepted.subscribe(value => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('editor_tos_accepted', value.toString());
    }
});
