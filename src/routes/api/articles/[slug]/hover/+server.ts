import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { articles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getWordAtIndex } from '$lib/utils';
import { auth } from '$lib/auth';
import { redis } from '$lib/server/redis';
import { cooldownManager } from '$lib/server/cooldown';
import { isValidWord } from '$lib/shared/wordMatching';

export const PUT: RequestHandler = async ({ params, request }) => {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        });

        if (!session?.user) {
            return new Response('Unauthorized', { status: 401 });
        }

        if (session.user.isBanned) {
            return json({ error: 'User is banned' }, { status: 403 });
        }

        if (cooldownManager.isOnCooldown(session.user.id)) {
            const remainingTime = cooldownManager.getRemainingTime(session.user.id);
            return json({ error: 'Please wait before making more edits', remainingTime }, { status: 429 });
        }

        const { wordIndex, newWord } = await request.json();

        if (typeof wordIndex !== 'number' || !newWord?.trim() || !isValidWord(newWord)) {
            return json({ error: 'Invalid word format or length' }, { status: 400 });
        }

        const article = await db.query.articles.findFirst({
            where: eq(articles.slug, params.slug)
        });

        if (!article || getWordAtIndex(article.content, wordIndex) === null) {
            return json({ error: 'Invalid article or word index' }, { status: 404 });
        }

        await redis.publish(
            `updates:${article.id}`,
            JSON.stringify({
                type: 'word_hover',
                data: {
                    newWord,
                    wordIndex,
                    editorId: session.user.id,
                    editorName: session.user.name,
                    editorImage: session.user.image,
                }
            })
        );

        return json({ success: true });
    } catch (error) {
        console.error('Hover update error:', error);
        return json({ error: 'Failed to process word hover' }, { status: 500 });
    }
};

export const DELETE: RequestHandler = async ({ params, request }) => {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        });

        if (!session?.user) {
            throw new Error('Unauthorized');
        }

        const { slug } = params;
        const { wordIndex } = await request.json();

        const article = await db.query.articles.findFirst({
            where: eq(articles.slug, slug)
        });

        if (!article) {
            return json({ error: 'Article not found' }, { status: 404 });
        }

        await redis.publish(
            `updates:${article.id}`,
            JSON.stringify({
                type: 'word_leave',
                data: {
                    wordIndex,
                    editorId: session.user.id
                }
            })
        );

        return json({ success: true });
    } catch (error: any) {
        console.error('Hover update error:', error);

        if (error.message === 'Unauthorized') {
            return new Response('Unauthorized', { status: 401 });
        }

        return json({ error: 'Failed to process word hover' }, { status: 500 });
    }
};
