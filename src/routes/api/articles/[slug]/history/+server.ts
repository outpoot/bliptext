import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles, revisions, user } from '$lib/server/db/schema';
import { eq, desc, and, lt } from 'drizzle-orm';
import { auth } from '$lib/auth';
import { timeQuery } from '$lib/server/db/timing';
import { getWordAtIndex } from '$lib/utils';

export async function GET({ params, url, request }) {
    const { slug } = params;
    const cursor = url.searchParams.get('cursor');
    const limit = 50;

    const session = await auth.api.getSession({
        headers: request.headers
    });
    const isAdmin = session?.user?.isAdmin;

    try {
        const article = await timeQuery('HISTORY_find_article', () =>
            db.query.articles.findFirst({
                where: eq(articles.slug, slug),
                columns: {
                    id: true,
                    slug: true,
                    title: true
                }
            })
        );

        if (!article) {
            throw error(404, 'Article not found');
        }

        const whereClause = cursor
            ? and(eq(revisions.articleId, article.id), lt(revisions.createdAt, new Date(cursor)))
            : eq(revisions.articleId, article.id);

        const userSelection = {
            id: user.id,
            name: user.name,
            image: user.image,
            ...(isAdmin ? { isBanned: user.isBanned } : {})
        };

        const history = await timeQuery('HISTORY_fetch_history', () =>
            db
                .select({
                    id: revisions.id,
                    wordChanged: revisions.wordChanged,
                    newWord: revisions.content,
                    wordIndex: revisions.wordIndex,
                    createdAt: revisions.createdAt,
                    user: userSelection
                })
                .from(revisions)
                .leftJoin(user, eq(revisions.createdBy, user.id))
                .where(whereClause)
                .orderBy(desc(revisions.createdAt))
                .limit(limit + 1)
        );

        const hasMore = history.length > limit;
        const items = history.slice(0, limit).map((revision) => ({
            ...revision,
            newWord: getWordAtIndex(revision.newWord, revision.wordIndex) || ''
        }));
        const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;

        return json(
            {
                history: items,
                article,
                hasMore,
                nextCursor
            },
            {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                    Pragma: 'no-cache',
                    Expires: '0'
                }
            }
        );
    } catch (err) {
        if (typeof err === 'object' && err && 'status' in err) {
            throw err;
        }
        console.error('Error fetching history:', err);
        throw error(500, 'Failed to fetch history');
    }
}
