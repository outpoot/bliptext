import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/auth';

export async function load({ request }) {
    const session = await auth.api.getSession({
        headers: request.headers
    });

    if (!session?.user?.isAdmin) {
        throw error(403, 'Not authorized');
    }

    const bannedUsers = await db.query.user.findMany({
        where: eq(user.isBanned, true),
        columns: {
            id: true,
            name: true,
            image: true,
            bannedAt: true
        },
        with: {
            bannedByUser: {
                columns: {
                    id: true,
                    name: true
                }
            }
        }
    });

    return {
        bannedUsers
    };
}
