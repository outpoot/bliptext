import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { user, revisions } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '$lib/auth';
import { timeQuery } from '$lib/server/db/timing';

function calculateBotMetrics(revisions: any[]) {
    if (revisions.length < 2) return null;

    let totalIntervalTime = 0;
    let maxConsecutiveRepetition = 1;
    let currentRepetition = 1;

    for (let i = 1; i < revisions.length; i++) {
        const currentTime = new Date(revisions[i].createdAt).getTime();
        const previousTime = new Date(revisions[i - 1].createdAt).getTime();
        totalIntervalTime += (previousTime - currentTime);

        if (revisions[i].content === revisions[i - 1].content) {
            currentRepetition++;
            maxConsecutiveRepetition = Math.max(maxConsecutiveRepetition, currentRepetition);
        } else {
            currentRepetition = 1;
        }
    }

    return {
        averageInterval: totalIntervalTime / (revisions.length - 1) / 1000,
        maxConsecutiveRepetition
    };
}


export async function GET({ url, request }) {
    const session = await auth.api.getSession({
        headers: request.headers
    });

    if (!session?.user?.isAdmin) {
        throw error(403, 'Not authorized');
    }

    const userId = url.searchParams.get('userId');
    if (!userId) {
        throw error(400, 'User ID is required');
    }

    try {
        const userInfo = await timeQuery('INSPECT_fetch_user', () =>
            db.query.user.findFirst({
                where: eq(user.id, userId),
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

        const recentRevisions = await timeQuery('INSPECT_fetch_user_revisions', () =>
            db.query.revisions.findMany({
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

        const botMetrics = calculateBotMetrics(recentRevisions);

        return json({
            ...userInfo,
            revisions: formattedRevisions,
            botMetrics
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
