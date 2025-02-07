import { json, error, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles, revisions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/auth';

export const POST: RequestHandler = async ({ request }) => {
    const session = await auth.api.getSession({
        headers: request.headers
    });

    if (!session?.user?.isAdmin) {
        throw error(403, 'Not authorized');
    }

    const { articleId } = await request.json();

    if (!articleId) {
        throw error(400, 'Article ID is required');
    }

    try {
        await db.transaction(async (tx) => {
            await tx.delete(revisions)
                .where(eq(revisions.articleId, articleId));

            await tx.delete(articles)
                .where(eq(articles.id, articleId));
        });

        return json({ success: true });
    } catch (err) {
        console.error('Failed to delete article:', err);
        throw error(500, 'Failed to delete article');
    }
}
