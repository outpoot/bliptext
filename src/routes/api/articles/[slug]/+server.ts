import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET({ params }) {
    const { slug } = params;

    try {
        const article = await db.query.articles.findFirst({
            where: eq(articles.slug, slug),
            with: {
                revisions: {
                    limit: 1,
                    orderBy: (revisions, { desc }) => [desc(revisions.createdAt)]
                }
            }
        });

        if (!article) {
            throw error(404, 'Article not found');
        }

        return json(article);
    } catch (err) {
        console.error('Error fetching article:', err);
        throw error(500, 'Failed to fetch article');
    }
}
