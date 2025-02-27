import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { timeQuery } from '$lib/server/db/timing';

const articleCache = new Map();

export async function GET({ params, url }) {
    const { slug } = params;
    const searchById = url.searchParams.get('byId') === 'true';
    const index = searchById ? 'id' : 'slug';
    const cacheKey = `${index}:${slug}`;
    const now = Date.now();

    if (articleCache.has(cacheKey)) {
        const cached = articleCache.get(cacheKey);
        if (cached.expiry > now) {
            return json(cached.data, {
                headers: {
                    'Cache-Control': 'public, s-maxage=60'
                }
            });
        }
    
        articleCache.delete(cacheKey);
    }

    try {
        const article = await timeQuery('ARTICLE_GET_fetch_article', () =>
            db.query.articles.findFirst({
                where: eq(articles[index], slug)
            })
        );

        if (!article) {
            throw error(404, 'Article not found');
        }

        articleCache.set(cacheKey, {
            data: article,
            expiry: now + 60000
        });

        return json(article, {
            headers: {
                'Cache-Control': 'public, s-maxage=60'
            }
        });
    } catch (err) {
        console.error('Error fetching article:', err);
        throw error(500, 'Failed to fetch article');
    }
}
