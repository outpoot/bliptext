import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';
import { articles } from '$lib/server/db/schema';
import { timeQuery } from '$lib/server/db/timing';

const MAX_QUERY_LENGTH = 200;
const MAX_RESULTS = 50;
const DEFAULT_RESULTS = 10;
const MIN_QUERY_LENGTH = 2;

function normalizeQuery(q: string) {
	return q.replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
}

export async function GET({ url }: any) {
	const raw = url.searchParams.get('q') ?? '';
	const pageParam = Number(url.searchParams.get('page') ?? '1');
	const limitParam = Number(url.searchParams.get('limit') ?? String(DEFAULT_RESULTS));

	const queryParam = normalizeQuery(raw).slice(0, MAX_QUERY_LENGTH);
	if (!queryParam || queryParam.length < MIN_QUERY_LENGTH) return json({ results: [] });

	const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
	const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), MAX_RESULTS) : DEFAULT_RESULTS;
	const offset = (page - 1) * limit;

	try {
		const startTime = Date.now();

		const rankingExpr = sql<number>`(
		ts_rank_cd(${articles.search_vector}, websearch_to_tsquery('english', ${queryParam}), 32) * 2 +
		CASE
			WHEN lower(${articles.title}) = lower(${queryParam}) THEN 3
			WHEN ${articles.title} ILIKE ${queryParam + '%'} THEN 1
			ELSE 0
		END - (length(${articles.title}) * 0.001)
	)`;

		const snippetExpr = sql<string>`ts_headline('english', ${articles.content}, websearch_to_tsquery('english', ${queryParam}), 'MaxFragments=2, MinWords=4, MaxWords=35, StartSel=<mark>, StopSel=</mark>')`;

		const results = await timeQuery('SEARCH_search_articles', () =>
			db.select({
				id: articles.id,
				title: articles.title,
				slug: articles.slug,
				rank: rankingExpr,
				snippet: snippetExpr
			})
				.from(articles)
				.where(sql`${articles.search_vector} @@ websearch_to_tsquery('english', ${queryParam})`)
				.orderBy(sql`${rankingExpr} DESC`)
				.limit(limit)
				.offset(offset)
				.execute()
		);

		console.log(`Search for "${queryParam}" took ${Date.now() - startTime}ms`);

		return json({
			results: results.map((row) => ({
				id: row.id,
				title: (row.title ?? '').slice(0, 200),
				slug: row.slug,
				content: (row.snippet ?? `View article about ${String(row.title ?? '').slice(0, 100)}...`).slice(0, 300),
				relevance: Number(row.rank ?? 0)
			})),
			meta: { query: queryParam, page, limit }
		});
	} catch (error) {
		console.error('Search error:', error);
		return json({
			results: [],
			error: 'Search temporarily unavailable'
		}, { status: 500 });
	}
}
