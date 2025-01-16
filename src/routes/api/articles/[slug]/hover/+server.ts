import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { articles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import Redis from 'ioredis';
import { getWordAtIndex, replaceWordAtIndex } from '$lib/utils';
import { env } from '$env/dynamic/private';
import { auth } from '$lib/auth';

const redis = new Redis(env.REDIS_URL!);

redis.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redis.on('connect', () => {
    console.log('Redis connected successfully');
});
export const PUT: RequestHandler = async ({ params, request }) => {
    try {
        // Get user from session
        const session = await auth.api.getSession({
            headers: request.headers
        });

        if (!session?.user) {
            throw new Error('Unauthorized');
        }

        const { wordIndex, newWord } = await request.json();
        const { slug } = params;

        if (typeof wordIndex !== 'number' || !newWord?.trim()) {
            return json({ error: 'Invalid word or index' }, { status: 400 });
        }

        if (!/^[a-zA-Z]{1,45}$/.test(newWord)) {
            return json({ error: 'Word must be 1-45 letters only' }, { status: 400 });
        }

        const article = await db.query.articles.findFirst({
            where: eq(articles.slug, slug)
        });

        if (!article) {
            return json({ error: 'Article not found' }, { status: 404 });
        }

        const oldWord = getWordAtIndex(article.content, wordIndex);
        const newContent = replaceWordAtIndex(article.content, wordIndex, newWord);

        await redis.publish(
            `updates:${article.id}`,
            JSON.stringify({
                type: 'word_hover',
                data: {
                    oldWord,
                    newWord,
                    wordIndex,
                    content: newContent,
                    editorId: session.user.id,
                    editorName: session.user.name,
                    editorImage: session.user.image,
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
