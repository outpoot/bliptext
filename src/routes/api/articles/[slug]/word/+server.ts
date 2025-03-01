import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { articles, revisions, user } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getWordAtIndex, replaceWordAtIndex } from '$lib/utils';
import { WORD_MATCH_REGEX, isValidWord } from '$lib/shared/wordMatching';
import { auth } from '$lib/auth';
import { redis } from '$lib/server/redis';
import { cooldownManager } from '$lib/server/cooldown';
import { sendDiscordWebhook } from '$lib/discord';
import { checkHardcore } from '$lib/shared/moderation';
import { timeQuery } from '$lib/server/db/timing';
import { WordProcessor } from '$lib/utils/wordProcessor';

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		if (session.user.isBanned) {
			return json({ error: 'User is banned' }, { status: 403 });
		}

		const { wordIndex, newWord, context } = await request.json();
		const contextData = context ? JSON.parse(context) : null;

		console.log('Received request:', { wordIndex, newWord, context });

		if (!isValidWord(newWord) || checkHardcore(newWord)) {
			return json({ error: 'Word must be 50 chars & either plain text, bold (**word**), italic (*word*), or a link ([word](url))' }, { status: 400 });
		}

		const article = await timeQuery('find_article', () =>
			db.query.articles.findFirst({
				where: eq(articles.slug, params.slug)
			})
		);

		if (!article) {
			return json({ error: 'Article not found' }, { status: 404 });
		}

		if (await cooldownManager.isOnCooldown(session.user.id)) {
			const remainingTime = cooldownManager.getRemainingTime(session.user.id);
			return json({
				error: "Please wait before making more edits",
				remainingTime
			}, { status: 429 });
		}

		const tempProcessor = new WordProcessor(article.content);
		function getWords(content: string): string[] {
			return tempProcessor.getWordsFromText(content);
		}

		function normalizeContext(segment: string): string {
			return segment
				.replace(/_/g, ' ')
				.replace(/\s+/g, ' ')
				.replace(/[^\w\s]/gi, '')
				.trim()
				.toLowerCase();
		}

		if (contextData) {
			const { before, word, after, index } = contextData;
			const words = getWords(article.content);

			const actualBefore = words.slice(Math.max(0, index - 2), index).join(' ').trim();
			const actualWord = (words[index] || '').trim();
			const actualAfter = words.slice(index + 1, Math.min(words.length, index + 3)).join(' ').trim();

			// console.log("Context check:", {
			// 	provided: {
			// 		before: normalizeContext(before),
			// 		word: normalizeContext(word),
			// 		after: normalizeContext(after)
			// 	},
			// 	computed: {
			// 		before: normalizeContext(actualBefore),
			// 		word: normalizeContext(actualWord),
			// 		after: normalizeContext(actualAfter)
			// 	}
			// });

			if (
				index !== wordIndex ||
				normalizeContext(before) !== normalizeContext(actualBefore)
			) {
				return json({ error: 'Context mismatch, please refresh the page' }, { status: 409 });
			}
		}

		const oldWord = getWordAtIndex(article.content, wordIndex);
		if (!oldWord) {
			return json({ error: 'Word not found' }, { status: 404 });
		}

		const updatedContent = replaceWordAtIndex(article.content, wordIndex, newWord);

		await timeQuery('PUT_WORD_update_word_transaction', () =>
			db.transaction(async (tx) => {
				const [newRevision] = await tx.insert(revisions)
					.values({
						articleId: article.id,
						content: updatedContent,
						wordChanged: oldWord,
						wordIndex,
						createdBy: session.user.id
					})
					.returning();

				await Promise.all([
					tx.update(user)
						.set({
							revisionCount: sql`COALESCE(${user.revisionCount}, 0) + 1`
						})
						.where(eq(user.id, session.user.id)),

					tx.update(articles)
						.set({
							content: updatedContent,
							current_revision: newRevision.id,
							updated_at: new Date(),
							revisionCount: sql`COALESCE(${articles.revisionCount}, 0) + 1`
						})
						.where(eq(articles.id, article.id))
				]);

				return [newRevision];
			})
		);

		await timeQuery('PUT_WORD_external_operations', () =>
			Promise.all([
				redis.publish(
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
				),
				sendDiscordWebhook({
					oldWord,
					newWord,
					articleTitle: article.title,
					articleSlug: article.slug,
					editorName: session.user.name,
					editorId: session.user.id
				})
			])
		);

		cooldownManager.addCooldown(session.user.id);

		return json({ success: true, newContent: updatedContent });
	} catch (error) {
		console.error('Failed to update word:', error);
		return json({ error: 'Failed to update word' }, { status: 500 });
	}
};
