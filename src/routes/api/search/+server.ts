import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { fuzzySearch } from '$lib/utils';

export async function GET({ url }) {
    const query = url.searchParams.get('q') || '';
    
    if (!query) {
        return json({ results: [] });
    }

    try {
        const allArticles = await db.query.articles.findMany();
        
        const results = allArticles
            .map(article => ({
                ...article,
                content: article.content.slice(0, 200),
                score: Math.max(
                    fuzzySearch(article.title, query),
                    fuzzySearch(article.content.slice(0, 200), query) * 0.5
                )
            }))
            .filter(article => article.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        return json({ results });
    } catch (error) {
        console.error('Search error:', error);
        return json({ results: [] });
    }
}
