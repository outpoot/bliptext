import type { PageLoad } from './$types';

export const load = (async ({ fetch }) => {
    const response = await fetch('/api/leaderboard');

    return {
        leaderboard: response.ok ? await response.json() : null
    };
}) satisfies PageLoad;
