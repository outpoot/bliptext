import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles, revisions } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET({ params }) {
    const { slug } = params;

    try {
        const article = await db.query.articles.findFirst({
            where: eq(articles.slug, slug)
        });

        if (!article) {
            throw error(404, 'Article not found');
        }

        const history = await db.query.revisions.findMany({
            where: eq(revisions.articleId, article.id),
            orderBy: [desc(revisions.createdAt)]
        });

        return json({ history, article });
    } catch (err) {
        console.error('Error fetching history:', err);
        throw error(500, 'Failed to fetch history');
    }
}
