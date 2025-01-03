import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			'lucide-svelte/icons': new URL(
				'./node_modules/lucide-svelte/dist/icons',
				import.meta.url
			).pathname
		}
	}
});