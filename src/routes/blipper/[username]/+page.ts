import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params, fetch }) => {
    const username = params.username.replace(/^@/, '');
    const response = await fetch(`/api/blipper?username=${encodeURIComponent(username)}`);

    if (response.status === 404) {
        return {
            username,
            userInfo: null,
            error: 'User not found'
        };
    }

    if (!response.ok) {
        throw error(response.status, 'Failed to load user');
    }

    return {
        username,
        userInfo: await response.json(),
        error: null
    };
}) satisfies PageLoad;
