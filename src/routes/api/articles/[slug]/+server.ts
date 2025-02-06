import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET({ params, url }) {
    const { slug } = params;
    const searchById = url.searchParams.get('byId') === 'true';
    const index = searchById ? 'id' : 'slug';

    try {
        const article = await db.query.articles.findFirst({
            where: eq(articles[index], slug)
        });

        if (!article) {
            throw error(404, 'Article not found');
        }

        return json(article, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (err) {
        console.error('Error fetching article:', err);
        throw error(500, 'Failed to fetch article');
    }
}
