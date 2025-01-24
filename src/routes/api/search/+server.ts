import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { articles } from '$lib/server/db/schema';

export async function GET({ url }) {
    const query = url.searchParams.get('q')?.trim() || '';
    if (!query || query.length < 2) return json({ results: [] });

    try {
        interface QueryResult {
            id: string;
            title: string;
            slug: string;
        }

        const results = await db.execute(sql`
            SELECT 
                id,
                title,
                slug
            FROM ${articles}
            WHERE title ILIKE ${'%' + query + '%'}
            ORDER BY title
            LIMIT 10
        `) as unknown as QueryResult[];

        return json({
            results: results.map(row => ({
                id: row.id,
                title: row.title.slice(0, 200),
                slug: row.slug,
                content: "LOL!"
            }))
        });
    } catch (error) {
        console.error('Search error:', error);
        return json({ results: [] });
    }
}