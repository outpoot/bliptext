import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { auth } from '$lib/auth';

export const load: LayoutServerLoad = async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user?.isAdmin) {
        throw redirect(303, '/');
    }

    return {
        user: session.user
    };
};
