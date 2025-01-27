import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { articles } from '$lib/server/db/schema';

export async function GET({ url }) {
    const query = url.searchParams.get('q')?.trim() || '';
    if (!query || query.length < 2) return json({ results: [] });

    try {
        const startTime = Date.now();
        
        const results = await db
            .select({
                id: articles.id,
                title: articles.title,
                slug: articles.slug
            })
            .from(articles)
            .where(sql`${articles.title} ILIKE ${'%' + query + '%'}`)
            .orderBy(articles.title)
            .limit(10);

        console.log(`Search for "${query}" took ${Date.now() - startTime}ms`);

        return json({
            results: results.map(row => ({
                id: row.id,
                title: row.title.slice(0, 200),
                slug: row.slug,
                content: "View article about " + row.title.slice(0, 100) + "..."
            }))
        });
    } catch (error) {
        console.error('Search error:', error);
        return json({ 
            results: [],
            error: "Search temporarily unavailable" 
        }, { status: 500 });
    }
}