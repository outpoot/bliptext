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
            content: string;
        }

        const results = await db.execute(sql`
            SELECT 
                id,
                title,
                slug,
                SUBSTRING(
                    REGEXP_REPLACE(
                        REGEXP_REPLACE(content, ':::.*?:::\s*', '', 'gs'),
                        '[^a-z0-9 ]', '', 'gi'
                    ), 1, 200
                ) AS content
            FROM ${articles}
            WHERE websearch_to_tsquery('english', ${query}) IS NOT NULL
            ORDER BY ts_rank_cd(
                to_tsvector('english', title || ' ' || content),
                websearch_to_tsquery('english', ${query})
            ) DESC
            LIMIT 10
        `) as unknown as QueryResult[];

        return json({
            results: results.map(row => ({
                id: row.id,
                title: row.title.slice(0, 200),
                slug: row.slug,
                content: row.content.slice(0, 200)
            }))
        });
    } catch {
        return json({ results: [] });
    }
}