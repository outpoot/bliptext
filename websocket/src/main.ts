import { createServer } from 'node:http';
import Redis from 'ioredis';
import WebSocket, { WebSocketServer, type RawData } from 'ws';
import { isValidWord } from '../../src/lib/shared/wordMatching';
import { checkHardcore } from '../../src/lib/shared/moderation';

const redisSubscriber = new Redis(process.env.REDIS_URL!);
const redisPublisher = new Redis(process.env.REDIS_URL!);

const cooldownCache = new Map<string, number>();
const COOLDOWN_KEY_PREFIX = 'cooldown:edit:';
const HEARTBEAT_INTERVAL = 30_000;

[redisSubscriber, redisPublisher].forEach((r) => {
	r.on('error', (err) => {
		console.error('Redis connection error:', err);
	});

	r.on('connect', () => {
		console.log('Redis connected successfully');
	});
});

redisSubscriber.on('message', (channel, msg) => {
	if (!channel.startsWith('updates:')) return;
	const articleId = channel.substring(8);

	Array.from(articleUsers.get(articleId) || [])
		.flatMap((userId) => Array.from(userSockets.get(userId) || []))
		.forEach((socket) => socket.send(msg));
});

type WebSocketData = {
	articleId?: string;
	user?: {
		id: string;
		isBanned: boolean;
		name?: string;
		image?: string;
	};
	connectionType?: 'editor' | 'viewer';
	lastActivity: number;
};

const articleUsers = new Map<string, Set<string>>();
type AppWebSocket = WebSocket & { data: WebSocketData };

const userSockets = new Map<string, Set<AppWebSocket>>();
const editorSockets = new Map<string, AppWebSocket>();
const ARTICLE_METADATA_TTL = 5 * 60_000;
const articleMetadataCache = new Map<
	string,
	{
		title: string;
		slug: string;
		expiresAt: number;
	}
>();
const articleMetadataRequests = new Map<
	string,
	Promise<{
		title: string;
		slug: string;
	} | null>
>();

async function getArticleMetadata(articleId: string): Promise<{
	title: string;
	slug: string;
} | null> {
	const cached = articleMetadataCache.get(articleId);
	if (cached && cached.expiresAt > Date.now()) {
		return cached;
	}

	const pending = articleMetadataRequests.get(articleId);
	if (pending) return pending;

	const request = (async () => {
		try {
			const response = await fetch(`${process.env.SITE_URL}/api/articles/${articleId}?byId=true`);
			if (!response.ok) return null;

			const article = (await response.json()) as {
				title: string;
				slug: string;
			};
			articleMetadataCache.set(articleId, {
				...article,
				expiresAt: Date.now() + ARTICLE_METADATA_TTL
			});
			return article;
		} catch (error) {
			console.error('Failed to fetch article:', error);
			return null;
		} finally {
			articleMetadataRequests.delete(articleId);
		}
	})();

	articleMetadataRequests.set(articleId, request);
	return request;
}

async function validateAuth(request: Request): Promise<{
	id: string;
	isBanned: boolean;
	name?: string;
	image?: string;
} | null> {
	const url = new URL(request.url);
	const token = url.searchParams.get('token');

	if (!token) return null;

	try {
		const sessionData = await redisPublisher.get(`ws:${token}`);
		if (!sessionData) return null;

		const { userId, isBanned, name, image } = JSON.parse(sessionData);
		await redisPublisher.del(`ws:${token}`);

		return userId ? { id: userId, isBanned, name, image } : null;
	} catch (error) {
		console.error('Auth validation error:', error);
		return null;
	}
}

async function broadcastUserCount(articleId: string): Promise<void> {
	const count = articleUsers.get(articleId)?.size ?? 0;
	const message = JSON.stringify({
		type: 'active_users_update',
		data: { count }
	});

	Array.from(articleUsers.get(articleId) || [])
		.flatMap((userId) => Array.from(userSockets.get(userId) || []))
		.forEach((socket) => socket.send(message));
}

async function handleSetArticle(ws: AppWebSocket, articleId: string): Promise<void> {
	const userId = ws.data.user?.id;
	if (!userId) {
		ws.close(4001, 'Authentication required');
		return;
	}

	if (ws.data.connectionType === 'editor') {
		const existingEditorSocket = editorSockets.get(userId);
		if (existingEditorSocket && existingEditorSocket !== ws) {
			existingEditorSocket.close(4000, 'New editor connection opened elsewhere');
		}
		editorSockets.set(userId, ws);
	}

	if (ws.data.articleId) {
		const prevArticle = articleUsers.get(ws.data.articleId);
		if (prevArticle) {
			const sockets = userSockets.get(userId);
			if (sockets) {
				sockets.delete(ws);
				if (sockets.size === 0) {
					prevArticle.delete(userId);
					if (prevArticle.size === 0) {
						articleUsers.delete(ws.data.articleId);
					}
					await broadcastUserCount(ws.data.articleId);
				}
			}
		}
	}

	ws.data.articleId = articleId;

	if (!userSockets.has(userId)) {
		userSockets.set(userId, new Set([ws]));
	} else {
		userSockets.get(userId)!.add(ws);
	}

	if (!articleUsers.has(articleId)) {
		articleUsers.set(articleId, new Set([userId]));
		await redisSubscriber.subscribe('updates:' + articleId);
		await broadcastUserCount(articleId);
	} else {
		const wasAdded = !articleUsers.get(articleId)!.has(userId);
		articleUsers.get(articleId)!.add(userId);
		if (wasAdded) {
			await broadcastUserCount(articleId);
		}
	}
}

async function handleGetActiveArticles(ws: AppWebSocket): Promise<void> {
	const activeArticles = await Promise.all(
		Array.from(articleUsers.entries())
			.filter(([, users]) => users.size > 0)
			.slice(0, 10)
			.map(async ([articleId]) => {
				const article = await getArticleMetadata(articleId);
				if (!article) return null;

				return {
					title: article.title,
					slug: article.slug,
					activeUsers: articleUsers.get(articleId)?.size ?? 0
				};
			})
	);

	ws.send(
		JSON.stringify({
			type: 'active_articles',
			data: activeArticles.filter(Boolean)
		})
	);
}

async function isUserOnCooldown(userId: string): Promise<boolean> {
	const cachedExpiry = cooldownCache.get(userId);
	if (cachedExpiry) {
		if (Date.now() < cachedExpiry) {
			return true;
		} else {
			cooldownCache.delete(userId);
		}
	}

	try {
		const cooldownKey = `${COOLDOWN_KEY_PREFIX}${userId}`;
		const cooldownUntil = await redisPublisher.get(cooldownKey);

		if (!cooldownUntil) return false;

		const expiryTime = parseInt(cooldownUntil);
		const isActive = Date.now() < expiryTime;

		if (isActive) {
			cooldownCache.set(userId, expiryTime);
		}

		return isActive;
	} catch (error) {
		console.error('Error checking edit cooldown:', error);
		return false;
	}
}

async function getRemainingCooldownTime(userId: string): Promise<number> {
	const cachedExpiry = cooldownCache.get(userId);
	if (cachedExpiry) {
		const remaining = cachedExpiry - Date.now();
		return remaining > 0 ? remaining : 0;
	}

	try {
		const cooldownKey = `${COOLDOWN_KEY_PREFIX}${userId}`;
		const cooldownUntil = await redisPublisher.get(cooldownKey);

		if (!cooldownUntil) return 0;

		const expiryTime = parseInt(cooldownUntil);
		const remaining = expiryTime - Date.now();

		if (remaining > 0) {
			cooldownCache.set(userId, expiryTime);
		}

		return remaining > 0 ? remaining : 0;
	} catch (error) {
		console.error('Error getting cooldown remaining time:', error);
		return 0;
	}
}

setInterval(() => {
	const now = Date.now();
	for (const [userId, expiry] of cooldownCache.entries()) {
		if (now > expiry) {
			cooldownCache.delete(userId);
		}
	}
}, 500);

function checkConnections() {
	const now = Date.now();
	for (const [userId, sockets] of userSockets.entries()) {
		const staleSockets = Array.from(sockets).filter((ws) => now - ws.data.lastActivity > HEARTBEAT_INTERVAL * 2);

		for (const socket of staleSockets) {
			console.log(`Terminating stale connection for user ${userId}`);
			socket.terminate();
		}
	}
}

setInterval(checkConnections, HEARTBEAT_INTERVAL);

async function handleWordHover(
	ws: AppWebSocket,
	data: { wordIndex: number; newWord: string }
): Promise<void> {
	const { wordIndex, newWord } = data;
	const userId = ws.data.user?.id;
	const articleId = ws.data.articleId;

	if (!userId || !articleId) {
		return;
	}

	if (typeof wordIndex !== 'number' || !newWord?.trim() || !isValidWord(newWord) || checkHardcore(newWord)) {
		ws.send(
			JSON.stringify({
				type: 'error',
				data: {
					code: 'INVALID_WORD',
					message: 'Invalid word format or content'
				}
			})
		);
		return;
	}

	if (await isUserOnCooldown(userId)) {
		ws.send(
			JSON.stringify({
				type: 'error',
				data: {
					code: 'COOLDOWN',
					message: 'Please wait before making more edits',
					remainingTime: await getRemainingCooldownTime(userId)
				}
			})
		);
		return;
	}

	await redisPublisher.publish(
		`updates:${articleId}`,
		JSON.stringify({
			type: 'word_hover',
			data: {
				newWord,
				wordIndex,
				editorId: userId,
				editorName: ws.data.user!.name,
				editorImage: ws.data.user!.image
			}
		})
	);
}

async function handleWordLeave(ws: AppWebSocket, data: { wordIndex: number }): Promise<void> {
	const { wordIndex } = data;
	const userId = ws.data.user?.id;
	const articleId = ws.data.articleId;

	if (!userId || !articleId) {
		return;
	}

	await redisPublisher.publish(
		`updates:${articleId}`,
		JSON.stringify({
			type: 'word_leave',
			data: {
				wordIndex,
				editorId: userId
			}
		})
	);
}

const websocketServer = new WebSocketServer({ noServer: true });

websocketServer.on('connection', (socket) => {
	const ws = socket as AppWebSocket;
	const interval = setInterval(() => {
		if (ws.readyState === WebSocket.OPEN) {
			ws.data.lastActivity = Date.now();
			ws.send(JSON.stringify({ type: 'ping' }));
			ws.ping();
		} else {
			clearInterval(interval);
		}
	}, HEARTBEAT_INTERVAL);

	ws.on('message', async (message: RawData, isBinary) => {
		ws.data.lastActivity = Date.now();
		if (isBinary) return;

		try {
			const data = JSON.parse(message.toString()) as {
				type: string;
				article?: { id: string };
				wordIndex?: number;
				newWord?: string;
			};
			switch (data.type) {
				case 'set_article':
					if (data.article) await handleSetArticle(ws, data.article.id);
					break;
				case 'get_active_articles': await handleGetActiveArticles(ws); break;
				case 'word_hover': await handleWordHover(ws, { wordIndex: data.wordIndex!, newWord: data.newWord! }); break;
				case 'word_leave': await handleWordLeave(ws, { wordIndex: data.wordIndex! }); break;
			}
		} catch (error) {
			console.error('Message handling error:', error);
		}
	});

	ws.on('pong', () => { ws.data.lastActivity = Date.now(); });
	ws.on('close', () => {
		clearInterval(interval);
		if (!ws.data.articleId || !ws.data.user) return;
		const userId = ws.data.user.id;
		if (ws.data.connectionType === 'editor' && editorSockets.get(userId) === ws) editorSockets.delete(userId);
		const sockets = userSockets.get(userId);
		if (!sockets) return;
		sockets.delete(ws);
		if (sockets.size > 0) return;
		userSockets.delete(userId);
		const users = articleUsers.get(ws.data.articleId);
		if (!users) return;
		users.delete(userId);
		if (users.size === 0) articleUsers.delete(ws.data.articleId);
		void broadcastUserCount(ws.data.articleId);
		const message = JSON.stringify({ type: 'user_disconnected', data: { editorId: userId } });
		Array.from(users).flatMap((uid) => Array.from(userSockets.get(uid) || [])).forEach((socket) => {
			if (socket !== ws) socket.send(message);
		});
	});
});

const server = createServer((_, response) => {
	response.writeHead(426, { 'Content-Type': 'text/plain' });
	response.end('WebSocket upgrade required');
});

server.on('upgrade', (request, socket, head) => {
	void (async () => {
		const authResult = await validateAuth(new Request(`http://${request.headers.host}${request.url}`));
		const url = new URL(request.url || '/', `http://${request.headers.host}`);
		if (authResult?.isBanned) {
			socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
			socket.destroy();
			return;
		}
		const connectionType = authResult ? (url.searchParams.get('type') === 'editor' ? 'editor' : 'viewer') : undefined;
		if (authResult && connectionType === 'editor') editorSockets.get(authResult.id)?.close(4000, 'New editor connection opened elsewhere');
		websocketServer.handleUpgrade(request, socket, head, (upgradedSocket) => {
			const ws = upgradedSocket as AppWebSocket;
			ws.data = { user: authResult || undefined, connectionType, lastActivity: Date.now() };
			websocketServer.emit('connection', ws, request);
		});
	})().catch((error) => {
		console.error('WebSocket upgrade failed:', error);
		socket.destroy();
	});
});

const port = Number(process.env.PORT) || 8080;
server.listen(port, () => console.log(`WebSocket server is running on port ${port}`));
