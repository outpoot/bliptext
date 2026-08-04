import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { timeQuery } from '$lib/server/db/timing';

export const GET: RequestHandler = async () => {
    try {
        const randomArticle = await timeQuery('RANDOM_ARTICLE_random_article', () =>
            db.execute(sql`
                WITH target AS (
                    SELECT gen_random_uuid() AS id
                ),
                candidate AS (
                    SELECT slug
                    FROM articles, target
                    WHERE articles.id >= target.id
                    ORDER BY articles.id
                    LIMIT 1
                )
                SELECT slug FROM candidate
                UNION ALL
                SELECT slug
                FROM (
                    SELECT slug
                    FROM articles
                    ORDER BY id
                    LIMIT 1
                ) AS fallback
                WHERE NOT EXISTS (SELECT 1 FROM candidate)
                LIMIT 1
            `)
        );

        if (!randomArticle?.[0]) {
            throw error(404, 'No articles found');
        }

        return json(
            { slug: randomArticle[0].slug },
            {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                    Pragma: 'no-cache',
                    Expires: '0'
                }
            }
        );
    } catch (err) {
        console.error('Error fetching random article:', err);
        throw error(500, 'Failed to fetch random article');
    }
};
