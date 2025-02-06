import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ setHeaders }) => {
    setHeaders({
        'cache-control': 'private, no-cache, no-store, must-revalidate'
    });

    try {
        const randomArticle = await db.execute(sql`
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
        `);

        if (!randomArticle?.[0]) {
            throw error(404, 'No articles found');
        }

        return json({ slug: randomArticle[0].slug });
    } catch (err) {
        console.error('Error fetching random article:', err);
        throw error(500, 'Failed to fetch random article');
    }
};