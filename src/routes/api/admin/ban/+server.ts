import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/auth';

export async function POST({ request }) {
    const session = await auth.api.getSession({
        headers: request.headers
    });

    if (!session?.user?.isAdmin) {
        throw error(403, 'Unauthorized');
    }

    const { userId } = await request.json();

    if (!userId) {
        throw error(400, 'User ID is required');
    }

    if (userId === session.user.id) {
        throw error(400, 'Cannot ban yourself');
    }

    try {
        const updateData = {
            isBanned: true,
            bannedAt: new Date(),
            updatedAt: new Date()
        };

        await db
            .update(user)
            .set(updateData)
            .where(eq(user.id, userId))
            .execute();

        return json({ success: true });
    } catch (err) {
        console.error('Failed to ban user:', err);
        throw error(500, 'Failed to ban user');
    }
}