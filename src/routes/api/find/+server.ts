import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { env } from '$env/dynamic/private';
import { sql } from 'drizzle-orm';
import { timeQuery } from '$lib/server/db/timing';

const ALLOWED_KEYS = new Set([
    'Name', 'Founded', 'Location', 'Founder', 'Revenue', 'Employees',
    'Programming Language', 'Users', 'Launched', 'Birth Name', 'Birth Date',
    'Occupation', 'Office', 'Term Start', 'Party', 'Nationality', 'Alias',
    'Years Active', 'Works', 'Other Names', 'Recorded', 'Artist', 'Genre'
]);

const FILLER_WORDS = new Set([
    'who', 'is', 'was', 'are', 'were', 'does', 'do', 'did', 'about',
    'the', 'a', 'an', 'of', 'for', 'on', 'in', 'at', 'to', 'by', 'with',
    'what', 'when', 'where', 'why', 'how', 'which', 'whom', 'whose', 'that', 'this',
    'biography', 'profile', 'history', 'info', 'information', 'age', 'net worth',
    'career', 'background', 'meaning', 'explanation', 'summary', 'details',
]);

type FindResult = {
    slug: string;
    title: string;
    score: number;
    content: string | null;
};

function sanitizeMarkdown(text: string): string {
    return text
        .replace(/^#\s+/, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .trim();
}

function parseSummary(content: string) {
    const summary_ = content.match(/:::summary\n([\s\S]*?):::/);
    if (!summary_) return { keys: [] };

    const summary = summary_[1];
    const image = summary.match(/!\[(.*?)\]\((.*?)\)/);
    const keyMatches = Array.from(summary.matchAll(/\*\*(.*?):\*\* (.*?)(?=\n|$)/g));

    const introduction_ = content.slice(summary_.index! + summary_[0].length).trim();
    const introduction = introduction_.split('\n\n')[0].trim();

    return {
        image: image ? {
            caption: image[1],
            url: image[2].replace(/\/\/\//g, "_")
        } : undefined,
        keys: keyMatches
            .map(match => ({
                key: match[1].trim(),
                value: sanitizeMarkdown(match[2].trim())
            }))
            .filter(k => k.key && k.value && ALLOWED_KEYS.has(k.key)),
        introduction: introduction ? sanitizeMarkdown(introduction) : undefined
    };
}

function validateSearchKey(request: Request) {
    const key = request.headers.get('x-search-key');
    return key === env.SEARCH_KEY;
}

export async function GET({ url, request }) {
    if (!validateSearchKey(request)) {
        throw error(401, 'Invalid or missing search key');
    }

    try {
        const query = url.searchParams.get('q')?.trim().slice(0, 200) || '';
        if (!query || query.length < 2) return json({ scores: [], bestMatch: null });

        const wordRegex = /\b\w+\b/g;
        const searchQuery = (query.match(wordRegex) || [])
            .filter(word => !FILLER_WORDS.has(word.toLowerCase()))
            .join(' ');

        const searchResults = await timeQuery('FIND_search_articles', () =>
            db.execute<FindResult>(sql`
                WITH ranked AS MATERIALIZED (
                    SELECT
                        slug,
                        title,
                        ts_rank_cd(search_vector, query) * 2 +
                        CASE
                            WHEN title ILIKE ${searchQuery} THEN 2
                            WHEN title ILIKE ${searchQuery + '%'} THEN 1
                            ELSE 0
                        END -
                        (length(title) * 0.001) AS score
                    FROM articles, websearch_to_tsquery('english', ${searchQuery}) query
                    WHERE search_vector @@ query
                    ORDER BY score DESC
                    LIMIT 10
                ),
                best AS (
                    SELECT slug
                    FROM ranked
                    WHERE score >= 0.1
                    ORDER BY score DESC
                    LIMIT 1
                )
                SELECT
                    ranked.slug,
                    ranked.title,
                    ranked.score,
                    CASE WHEN ranked.slug = best.slug THEN articles.content END AS content
                FROM ranked
                LEFT JOIN best ON ranked.slug = best.slug
                LEFT JOIN articles ON articles.slug = best.slug
                ORDER BY ranked.score DESC
            `)
        );

        if (searchResults.length === 0) {
            return json({ scores: [], bestMatch: null });
        }

        const scores = searchResults.map(({ slug, title, score }) => ({ slug, title, score }));
        const bestScore = searchResults[0];
        let bestMatch = null;

        if (bestScore.score >= 0.1) {
            if (bestScore.content) {
                bestMatch = {
                    slug: bestScore.slug,
                    title: bestScore.title,
                    content: bestScore.content,
                    summary: parseSummary(bestScore.content)
                };
            }
        }

        return json({
            scores,
            bestMatch
        });
    } catch (error) {
        console.error('Find error:', error);
        return json({
            scores: [],
            bestMatch: null,
            error: "Search temporarily unavailable"
        }, { status: 500 });
    }
}
