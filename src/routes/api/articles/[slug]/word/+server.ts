import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles, revisions } from '$lib/server/db/schema';
import { and, eq, gte } from 'drizzle-orm';
import { getWordAtIndex, isValidWord, replaceWordAtIndex } from '$lib/utils';
import { auth } from '$lib/auth';
import { redis } from '$lib/server/redis';

export async function PUT({ params, request }) {
	const { wordIndex, newWord } = await request.json();
	const { slug } = params;

	if (typeof wordIndex !== 'number' || !newWord) {
		return json({ error: 'Word index and new word are required' }, { status: 400 });
	}

	if (!isValidWord(newWord)) {
		return json({
			error: 'Word must be either plain text, bold (**word**), italic (*word*), or a link ([word](url))'
		}, { status: 400 });
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
						gte(revisions.createdAt, new Date(Date.now() - 1000 * 30)) // 30 seconds
					)
				)
			);

		if (lastXMinRevisions.length > 0) {
			return json({ error: "You edited this article recently! Please wait before editing again." }, { status: 429 });
		}

		const oldWord = getWordAtIndex(article.content, wordIndex);
		const newContent = replaceWordAtIndex(article.content, wordIndex, newWord);

		if (oldWord === null) {
			return json({ error: 'Word index out of bounds' }, { status: 400 });
		}

		const [revision] = await db
			.insert(revisions)
			.values({
				articleId: article.id,
				content: newContent,
				wordChanged: oldWord,
				wordIndex,
				createdBy: session.user.id
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
					replace: true
				}
			})
		);

		return json({ success: true, newContent });
	} catch (error) {
		console.error('Failed to update word:', error);
		return json({ error: 'Failed to update word' }, { status: 500 });
	}
}
