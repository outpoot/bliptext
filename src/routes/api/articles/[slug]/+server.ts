import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { timeQuery } from '$lib/server/db/timing';

// const articleCache = new Map();

export async function GET({ params, url }) {
    const { slug } = params;
    const searchById = url.searchParams.get('byId') === 'true';
    const noCache = url.searchParams.get('noCache') === 'true';
    const index = searchById ? 'id' : 'slug';

    try {
        const article = await timeQuery('ARTICLE_GET_fetch_article', () =>
            db.query.articles.findFirst({
                where: eq(articles[index], slug),
                columns: searchById
                    ? {
                          id: true,
                          title: true,
                          slug: true
                      }
                    : {
                          id: true,
                          title: true,
                          slug: true,
                          content: true,
                          current_revision: true,
                          created_by: true,
                          created_at: true,
                          updated_at: true,
                          revisionCount: true
                      }
            })
        );

        if (!article) {
            throw error(404, 'Article not found');
        }

        return json(article, {
            headers: {
                'Cache-Control': noCache
                    ? 'private, no-store'
                    : searchById
                      ? 'public, max-age=300, s-maxage=3600'
                      : 'public, max-age=30, s-maxage=60, stale-while-revalidate=300'
            }
        });
    } catch (err) {
        if (typeof err === 'object' && err && 'status' in err) {
            throw err;
        }
        console.error('Error fetching article:', err);
        throw error(500, 'Failed to fetch article');
    }
}
