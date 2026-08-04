import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { timeQuery } from '$lib/server/db/timing';

const MAX_QUERY_LENGTH = 200;

export async function GET({ url }) {
    const queryParam = url.searchParams.get('q')?.trim() || '';
    const query = queryParam.slice(0, MAX_QUERY_LENGTH);
    if (!query || query.length < 2) return json({ results: [] });

    try {
        const results = await timeQuery('SEARCH_search_articles', () =>
            db.execute<{
                id: string;
                title: string;
                slug: string;
                rank: number;
            }>(sql`
                WITH search_query AS (
                    SELECT websearch_to_tsquery('english', ${query}) AS query
                )
                SELECT
                    id,
                    title,
                    slug,
                    (
                        ts_rank_cd(search_vector, search_query.query, 32) * 2 +
                        CASE
                            WHEN title ILIKE ${query} THEN 2
                            WHEN title ILIKE ${query + '%'} THEN 1
                            ELSE 0
                        END -
                        (length(title) * 0.001)
                    ) AS rank
                FROM articles
                CROSS JOIN search_query
                WHERE search_vector @@ search_query.query
                ORDER BY rank DESC
                LIMIT 50
            `)
        );

        return json(
            {
                results: results.map((row) => ({
                    id: row.id,
                    title: row.title.slice(0, 200),
                    slug: row.slug,
                    content: 'View article about ' + row.title.slice(0, 100) + '...',
                    relevance: row.rank
                }))
            },
            {
                headers: {
                    'Cache-Control': 'public, max-age=30, s-maxage=300, stale-while-revalidate=600'
                }
            }
        );
    } catch (error) {
        console.error('Search error:', error);
        return json(
            {
                results: [],
                error: 'Search temporarily unavailable'
            },
            { status: 500 }
        );
    }
}
