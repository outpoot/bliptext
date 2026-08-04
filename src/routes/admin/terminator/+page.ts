import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ fetch }) => {
    const response = await fetch('/api/admin/terminator');
    if (!response.ok) {
        throw error(response.status, 'Failed to load account groups');
    }

    return {
        ipGroups: await response.json()
    };
}) satisfies PageLoad;
