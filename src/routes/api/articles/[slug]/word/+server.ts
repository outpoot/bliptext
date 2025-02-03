import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles, revisions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getWordAtIndex, isValidWord, replaceWordAtIndex } from '$lib/utils';
import { auth } from '$lib/auth';
import { redis } from '$lib/server/redis';
import { cooldownManager } from '$lib/server/cooldown';
import { sendDiscordWebhook } from '$lib/discord';
// import { validateTurnstile } from '$lib/turnstile';

export async function PUT({ params, request }) {
	const { wordIndex, newWord } = await request.json();
	const { slug } = params;

	// if (!captchaToken) {
	// 	return json({ error: 'CAPTCHA verification required' }, { status: 400 });
	// }

	// const isCaptchaValid = await validateTurnstile(captchaToken);
	// if (!isCaptchaValid) {
	// 	return json({ error: 'CAPTCHA verification failed' }, { status: 400 });
	// }

	if (typeof wordIndex !== 'number' || !newWord) {
		return json({ error: 'Word index and new word are required' }, { status: 400 });
	}

	if (!isValidWord(newWord)) {
		return json({
			error: 'Word must be 50 chars & either plain text, bold (**word**), italic (*word*), or a link ([word](url))'
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

		if (cooldownManager.isOnCooldown(session.user.id)) {
			const remainingTime = cooldownManager.getRemainingTime(session.user.id);
			return json({
				error: "Please wait before making more edits",
				remainingTime
			}, { status: 429 });
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

		return json({ success: true, newContent });
	} catch (error) {
		console.error('Failed to update word:', error);
		return json({ error: 'Failed to update word' }, { status: 500 });
	}
}
