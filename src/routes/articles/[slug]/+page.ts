import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ fetch, params }) => {
    const response = await fetch(`/api/articles/${params.slug}`);
    
    if (!response.ok) {
        throw error(404, 'Article not found');
    }

    const article = await response.json();
    console.log(article);
    return { article };
}) satisfies PageLoad;
