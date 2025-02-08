import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, articles, revisions } from '$lib/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET() {
    try {
        const activeEditors = await db
            .select({
                id: user.id,
                name: user.name,
                image: user.image,
                revisionCount: user.revisionCount
            })
            .from(user)
            .where(eq(user.isBanned, false))
            .orderBy(desc(user.revisionCount))
            .limit(5);

        const topArticles = await db
            .select({
                id: articles.id,
                title: articles.title,
                slug: articles.slug,
                revisionCount: articles.revisionCount
            })
            .from(articles)
            .where(sql`${articles.revisionCount} > 0`)
            .orderBy(desc(articles.revisionCount))
            .limit(5);

        const result = {
            activeEditors,
            topArticles
        };

        return json(result, {
            headers: {
                'Cache-Control': 'public, max-age=30'
            }
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        return json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }
}
