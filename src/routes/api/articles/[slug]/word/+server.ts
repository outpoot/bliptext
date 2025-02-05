import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { articles, revisions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getWordAtIndex, replaceWordAtIndex } from '$lib/utils';
import { WORD_MATCH_REGEX, isValidWord } from '$lib/shared/wordMatching';
import { auth } from '$lib/auth';
import { redis } from '$lib/server/redis';
import { cooldownManager } from '$lib/server/cooldown';
import { sendDiscordWebhook } from '$lib/discord';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { wordIndex, newWord, context } = await request.json();
		const contextData = context ? JSON.parse(context) : null;

		if (!isValidWord(newWord)) {
			return json({ error: 'Word must be 50 chars & either plain text, bold (**word**), italic (*word*), or a link ([word](url))' }, { status: 400 });
		}

		const article = await db.query.articles.findFirst({
			where: eq(articles.slug, params.slug)
		});

		if (!article) {
			return json({ error: 'Article not found' }, { status: 404 });
		}

		if (cooldownManager.isOnCooldown(session.user.id)) {
			const remainingTime = cooldownManager.getRemainingTime(session.user.id);
			return json({
				error: "Please wait before making more edits",
				remainingTime
			}, { status: 429 });
		}

		// Verify the context matches with surrounding text
		const rawTextWithoutTags = article.content
			.replace(/:::summary[\s\S]*?:::/g, '')
			.replace(/^#.*$/gm, '');
		const words = rawTextWithoutTags.match(WORD_MATCH_REGEX) || [];
		console.log('Server extracted words:', words);

		if (contextData) {
			const { before, word, after, index } = contextData;
			const actualBefore = words.slice(Math.max(0, index - 2), index).join(' ');
			const actualWord = words[index];
			const actualAfter = words.slice(index + 1, Math.min(words.length, index + 3)).join(' ');

			if (index !== wordIndex ||
				before !== actualBefore ||
				word !== actualWord ||
				after !== actualAfter) {
				return json({ error: 'Context mismatch, please refresh the page' }, { status: 409 });
			}
		}

		const oldWord = getWordAtIndex(article.content, wordIndex);
		if (!oldWord) {
			return json({ error: 'Word not found' }, { status: 404 });
		}

		const updatedContent = replaceWordAtIndex(article.content, wordIndex, newWord);

		const [revision] = await db
			.insert(revisions)
			.values({
				articleId: article.id,
				content: updatedContent,
				wordChanged: oldWord,
				wordIndex,
				createdBy: session.user.id
			})
			.returning();

		await db
			.update(articles)
			.set({
				content: updatedContent,
				current_revision: revision.id,
				updated_at: new Date()
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

		await sendDiscordWebhook({
			oldWord,
			newWord,
			articleTitle: article.title,
			articleSlug: article.slug,
			editorName: session.user.name,
			editorId: session.user.id
		});

		cooldownManager.addCooldown(session.user.id);

		return json({ success: true, newContent: updatedContent });
	} catch (error) {
		console.error('Failed to update word:', error);
		return json({ error: 'Failed to update word' }, { status: 500 });
	}
};
