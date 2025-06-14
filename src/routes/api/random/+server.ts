import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { timeQuery } from '$lib/server/db/timing';

export const GET: RequestHandler = async () => {
    try {
        const randomArticle = await timeQuery('RANDOM_ARTICLE_random_article', () =>
            db.execute(sql`
                WITH bounds AS (
                    SELECT 
                        min(created_at) as min_date,
                        max(created_at) as max_date
                    FROM articles
                )
                SELECT slug 
                FROM articles
                TABLESAMPLE SYSTEM (1)
                LIMIT 1;
            `)
        );

        if (!randomArticle?.[0]) {
            throw error(404, 'No articles found');
        }

        return json({ slug: randomArticle[0].slug }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (err) {
        console.error('Error fetching random article:', err);
        throw error(500, 'Failed to fetch random article');
    }
};