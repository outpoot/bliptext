import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ fetch, params }) => {
    try {
        const response = await fetch(`/api/articles/${params.slug}?noCache=true`);

        if (!response.ok) {
            throw error(404, 'Article not found');
        }

        const article = await response.json();
        return { article };
    } catch (err) {
        if (typeof err === 'object' && err && 'status' in err) {
            throw err;
        }
        console.error('Failed to load article:', err);
        throw error(500, 'Failed to load article');
    }
}) satisfies PageLoad;
