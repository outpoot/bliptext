import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter({
            protocol_header: 'X-Forwarded-Proto',
            host_header: 'X-Forwarded-Host',
        }),
        csrf: {
            checkOrigin: true
        }
    }
};

export default config;