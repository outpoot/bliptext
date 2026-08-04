import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, revisions } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '$lib/auth';
import { timeQuery } from '$lib/server/db/timing';
import { getWordAtIndex } from '$lib/utils';

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
            where: eq(user.name, username),
            columns: {
                id: true,
                name: true,
                image: true,
                isBanned: true,
                createdAt: true,
                revisionCount: true
            }
        })
    );

    if (!userInfo) {
        throw error(404, 'User not found');
    }

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

    const formattedRevisions = recentRevisions.map((rev) => ({
        id: rev.id,
        createdAt: rev.createdAt,
        wordChanged: rev.wordChanged,
        wordIndex: rev.wordIndex,
        newWord: getWordAtIndex(rev.content, rev.wordIndex) || '',
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

    return json(
        {
            ...userInfo,
            revisions: formattedRevisions,
            totalRevisions: userInfo.revisionCount
        },
        {
            headers: {
                'Cache-Control': 'private, max-age=30',
                Vary: 'Cookie'
            }
        }
    );
}
