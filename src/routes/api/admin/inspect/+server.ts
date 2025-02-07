import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, revisions } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '$lib/auth';

export async function GET({ url, request }) {
    const session = await auth.api.getSession({
        headers: request.headers
    });

    if (!session?.user?.isAdmin) {
        throw error(403, 'Not authorized');
    }

    const userId = url.searchParams.get('userId');
    const username = url.searchParams.get('username');

    if (!userId && !username) {
        throw error(400, 'User ID or username is required');
    }

    try {
        const userInfo = await db.query.user.findFirst({
            where: userId ? 
                eq(user.id, userId) : 
                eq(user.name, username as string),
            columns: {
                id: true,
                name: true,
                image: true,
                isBanned: true,
                createdAt: true
            }
        });

        if (!userInfo) {
            throw error(404, 'User not found');
        }

        const recentRevisions = await db.query.revisions.findMany({
            where: eq(revisions.createdBy, userId),
            limit: 50,
            orderBy: [desc(revisions.createdAt)],
            with: {
                article: {
                    columns: {
                        title: true,
                        slug: true
                    }
                }
            }
        });

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
            revisions: formattedRevisions
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (err) {
        console.error('Failed to fetch user:', err);
        throw error(500, 'Failed to fetch user');
    }
}
