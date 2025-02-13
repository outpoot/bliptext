import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'lyntr';

function getCookie(name: string): string | null {
    if (!browser) return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

function setCookie(name: string, value: string, days: number) {
    if (!browser) return;
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

function createThemeStore() {
    const getInitialTheme = (): Theme => {
        if (browser) {
            const cookieTheme = getCookie('theme') as Theme;
            if (cookieTheme) return cookieTheme;

            const localTheme = localStorage.getItem('theme') as Theme;
            if (localTheme) return localTheme;
        }
        return 'light';
    };

    const { subscribe, set } = writable<Theme>(getInitialTheme());

    return {
        subscribe,
        set: (theme: Theme) => {
            if (browser) {
                setCookie('theme', theme, 365);
                localStorage.setItem('theme', theme);
                document.documentElement.classList.remove('light', 'dark', 'lyntr');
                document.documentElement.classList.add(theme);
            }
            set(theme);
        }
    };
}

export const theme = createThemeStore();

// Initialize theme on client side
if (browser) {
    theme.subscribe(current => {
        document.documentElement.classList.add(current);
    });
}
