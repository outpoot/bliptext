import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles, revisions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getWordAtIndex, replaceWordAtIndex } from '$lib/utils';

export async function PUT({ params, request }) {
    const { wordIndex, newWord } = await request.json();
    const { slug } = params;

    if (typeof wordIndex !== 'number' || !newWord) {
        return json({ error: 'Word index and new word are required' }, { status: 400 });
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

        const [revision] = await db.insert(revisions)
            .values({
                articleId: article.id,
                content: newContent,
                wordChanged: oldWord,
                wordIndex,
                createdBy: 'anonymous' // TODO: Add proper user tracking
            })
            .returning();

        await db.update(articles)
            .set({
                content: newContent,
                currentRevision: revision.id,
                updatedAt: new Date()
            })
            .where(eq(articles.id, article.id));

        return json({ success: true, newContent });
    } catch (error) {
        return json({ error: 'Failed to update word' }, { status: 500 });
    }
}
