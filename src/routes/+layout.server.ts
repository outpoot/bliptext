import { auth } from '$lib/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
    const sessionResponse = await auth.api.getSession({
        headers: event.request.headers
    });

    const theme = event.cookies.get('theme') || 'light';

    return {
        userSession: sessionResponse?.user || null,
        url: event.url.pathname,
        theme
    };
};
