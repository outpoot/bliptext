import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import Redis from 'ioredis';
import { getWordAtIndex, replaceWordAtIndex } from '$lib/utils';
import { env } from '$env/dynamic/private';

const redis = new Redis(env.REDIS_URL!);

export async function PUT({ params, request }) {
    const { wordIndex, newWord } = await request.json();
    const { slug } = params;

    if (typeof wordIndex !== 'number' || !newWord?.trim()) {
        return json({ error: 'Invalid word or index' }, { status: 400 });
    }

    if (!/^[a-zA-Z]{1,45}$/.test(newWord)) {
        return json({ error: 'Word must be 1-45 letters only' }, { status: 400 });
    }

    try {
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
                data: { oldWord, newWord, wordIndex, content: newContent }
            })
        );

        return json({ success: true, oldWord, newWord, newContent });
    } catch (error) {
        console.error('Hover update error:', error);
        return json({ error: 'Failed to process word hover' }, { status: 500 });
    }
}
