import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { articles } from '$lib/server/db/schema';
import { timeQuery } from '$lib/server/db/timing';

const MAX_QUERY_LENGTH = 200;

export async function GET({ url }) {
    const queryParam = url.searchParams.get('q')?.trim() || '';
    const query = queryParam.slice(0, MAX_QUERY_LENGTH);
    if (!query || query.length < 2) return json({ results: [] });

    try {
        const startTime = Date.now();

        const rankingExpr = sql<number>`(
            ts_rank_cd(${articles.search_vector}, websearch_to_tsquery('english', ${query}), 32) * 2 +
            CASE WHEN ${articles.title} ILIKE ${query} THEN 2 
                 WHEN ${articles.title} ILIKE ${query + '%'} THEN 1
                 ELSE 0 
            END -
            (length(${articles.title}) * 0.001)
        )`;

        const results = await timeQuery('SEARCH_search_articles', () =>
            db.select({
                id: articles.id,
                title: articles.title,
                slug: articles.slug,
                rank: rankingExpr,
            })
                .from(articles)
                .where(sql`${articles.search_vector} @@ websearch_to_tsquery('english', ${query})`)
                .orderBy(sql`${rankingExpr} DESC`)
                .limit(50)
                .execute()
        );

        console.log(`Search for "${query}" took ${Date.now() - startTime}ms`);

        return json({
            results: results.map(row => ({
                id: row.id,
                title: row.title.slice(0, 200),
                slug: row.slug,
                content: "View article about " + row.title.slice(0, 100) + "...",
                relevance: row.rank
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