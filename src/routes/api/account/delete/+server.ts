import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { timeQuery } from '$lib/server/db/timing';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const session = await timeQuery('ACCOUNT_DELETE_auth_session', () =>
            auth.api.getSession({ headers: request.headers })
        );
        if (!session?.user) {
            return new Response('Unauthorized', { status: 401 });
        }
        if (session.user.isBanned) {
            return json({
                error: 'Account deletion is not allowed for banned users to prevent ban evasion.'
            }, { status: 403 });
        }

        await timeQuery('ACCOUNT_DELETE_delete_user', () =>
            db.delete(user).where(eq(user.id, session.user.id))
        );

        await timeQuery('ACCOUNT_DELETE_sign_out', () =>
            auth.api.signOut({ headers: request.headers })
        );

        return json({ success: true });
    } catch (error) {
        console.error('Account deletion error:', error);
        return json({
            error: 'Failed to delete account',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
};
