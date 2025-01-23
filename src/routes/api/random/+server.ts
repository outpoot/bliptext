import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
    try {
        const randomArticle = await db.query.articles.findFirst({
            where: sql`1=1`,
            orderBy: sql`RANDOM()`
        });

        if (!randomArticle) {
            throw error(404, 'No articles found');
        }

        return json({ slug: randomArticle.slug });
    } catch (err) {
        console.error('Error fetching random article:', err);
        throw error(500, 'Failed to fetch random article');
    }
};
