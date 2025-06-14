import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, revisions } from '$lib/server/db/schema';
import { eq, desc, count, like } from 'drizzle-orm';
import { auth } from '$lib/auth';
import { timeQuery } from '$lib/server/db/timing';

export async function GET({ url, request }) {
    const session = await auth.api.getSession({
        headers: request.headers
    });

    if (!session?.user) {
        throw error(401, 'Not authenticated');
    }

    const username = url.searchParams.get('username');
    if (!username) {
        throw error(400, 'Username is required');
    }

    const isAdmin = session.user.isAdmin === true;

    const userInfo = await timeQuery('BLIPPER_fetch_user', () =>
        db.query.user.findFirst({
            where: like(user.name, username),
            columns: {
                id: true,
                name: true,
                image: true,
                isBanned: true,
                createdAt: true
            }
        })
    );

    if (!userInfo) {
        throw error(404, 'User not found');
    }

    const [totalRevisionsResult] = await timeQuery('BLIPPER_count_user_revisions', () =>
        db.select({ count: count() })
            .from(revisions)
            .where(eq(revisions.createdBy, userInfo.id))
    );

    const totalRevisions = totalRevisionsResult?.count || 0;
    const revisionLimit = isAdmin ? 50 : 20;

    const recentRevisions = await timeQuery('BLIPPER_fetch_user_revisions', () =>
        db.query.revisions.findMany({
            where: eq(revisions.createdBy, userInfo.id),
            limit: revisionLimit,
            orderBy: [desc(revisions.createdAt)],
            with: {
                article: {
                    columns: {
                        title: true,
                        slug: true
                    }
                }
            }
        })
    );

    const formattedRevisions = recentRevisions.map(rev => ({
        id: rev.id,
        createdAt: rev.createdAt,
        wordChanged: rev.wordChanged,
        wordIndex: rev.wordIndex,
        newWord: rev.content,
        article: {
            title: rev.article.title,
            slug: rev.article.slug
        },
        user: {
            id: userInfo.id,
            name: userInfo.name,
            image: userInfo.image,
            isBanned: userInfo.isBanned
        }
    }));

    return json({
        ...userInfo,
        revisions: formattedRevisions,
        totalRevisions
    }, {
        headers: {
            'Cache-Control': 'public, s-maxage=60'
        }
    });
}
