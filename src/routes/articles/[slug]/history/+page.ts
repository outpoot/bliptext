import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ fetch, params }) => {
    try {
        const response = await fetch(`/api/articles/${params.slug}/history`);
        if (!response.ok) {
            throw error(404, 'Article not found');
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.error('Failed to load history:', err);
        throw error(500, 'Failed to load history');
    }
}) satisfies PageLoad;
