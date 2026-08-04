import type { PageLoad } from './$types';

export const load = (async ({ url, fetch }) => {
    const query = url.searchParams.get('q') || '';
    if (query.trim().length < 2) {
        return {
            query,
            results: []
        };
    }

    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = response.ok ? await response.json() : { results: [] };

    return {
        query,
        results: data.results
    };
}) satisfies PageLoad;
