import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles, revisions } from '$lib/server/db/schema';
import { and, eq, gte } from 'drizzle-orm';
import { getWordAtIndex, replaceWordAtIndex } from '$lib/utils';
import { auth } from '$lib/auth';

export async function PUT({ params, request }) {
	let { wordIndex, newWord } = await request.json();
	const { slug } = params;

	if (typeof wordIndex !== 'number' || !newWord) {
		return json({ error: 'Word index and new word are required' }, { status: 400 });
	}

	if (!/^[a-zA-Z]{1,45}$/.test(newWord)) {
		return json({ error: 'Word must be 1-45 letters only' }, { status: 400 });
	}

	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session) {
		return json({ error: 'You must be logged in to edit a word' }, { status: 401 });
	}

	try {
		const article = await db.query.articles.findFirst({
			where: eq(articles.slug, slug)
		});

		if (!article) {
			return json({ error: 'Article not found' }, { status: 404 });
		}

		const lastXMinRevisions = await db
			.select()
			.from(revisions)
			.where(
				and(
					eq(revisions.articleId, article.id),
					and(
						eq(revisions.createdBy, session.user.id),
						gte(revisions.createdAt, new Date(Date.now() - 1000 * 60 * 5))
					)
				)
			);

        if(lastXMinRevisions.length > 0) {
            return json({error: "You edited this article recently! Please wait before editing again."}, {status: 429})
        }

		const oldWord = getWordAtIndex(article.content, wordIndex);
        if(oldWord.startsWith("\n")) newWord = "\n" + newWord
        if(oldWord.endsWith("\n")) newWord += "\n"

		const newContent = replaceWordAtIndex(article.content, wordIndex, newWord);

		const [revision] = await db
			.insert(revisions)
			.values({
				articleId: article.id,
				content: newContent,
				wordChanged: oldWord,
				wordIndex,
				createdBy: session?.user.id
			})
			.returning();

		await db
			.update(articles)
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
