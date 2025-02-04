import type { ServerWebSocket } from 'bun';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);
const normalRedis = new Redis(process.env.REDIS_URL!);

[redis, normalRedis].forEach((r) => {
	r.on('error', (err) => {
		console.error('Redis connection error:', err);
	});

	r.on('connect', () => {
		console.log('Redis connected successfully');
	});
});

redis.on('message', (channel, msg) => {
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
	};
	connectionType?: 'editor' | 'viewer';
};

const articleUsers = new Map<string, Set<string>>();
const userSockets = new Map<string, Set<ServerWebSocket<WebSocketData>>>();
const editorSockets = new Map<string, ServerWebSocket<WebSocketData>>();

async function validateAuth(request: Request): Promise<{ id: string; isBanned: boolean } | null> {
	const url = new URL(request.url);
	const token = url.searchParams.get('token');

	if (!token) return null;

	try {
		const sessionData = await normalRedis.get(`ws:${token}`);
		if (!sessionData) return null;

		const { userId, isBanned } = JSON.parse(sessionData);
		await normalRedis.del(`ws:${token}`);

		return userId ? { id: userId, isBanned } : null;
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

async function handleSetArticle(
	ws: ServerWebSocket<WebSocketData>,
	articleId: string
): Promise<void> {
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

	// cleanup previous article if exists
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
		await redis.subscribe('updates:' + articleId);
		await broadcastUserCount(articleId);
	} else {
		const wasAdded = !articleUsers.get(articleId)!.has(userId);
		articleUsers.get(articleId)!.add(userId);
		if (wasAdded) {
			await broadcastUserCount(articleId);
		}
	}
}

async function handleGetActiveArticles(ws: ServerWebSocket<WebSocketData>): Promise<void> {
	const activeArticles = await Promise.all(
		Array.from(articleUsers.entries())
			.filter(([, users]) => users.size > 0)
			.map(async ([articleId]) => {
				try {
					const response = await fetch(
						`${process.env.SITE_URL}/api/articles/${articleId}?byId=true`
					);
					if (!response.ok) return null;

					const article = await response.json();
					return {
						title: article.title,
						slug: article.slug,
						activeUsers: articleUsers.get(articleId)?.size ?? 0
					};
				} catch (error) {
					console.error('Failed to fetch article:', error);
					return null;
				}
			})
	);

	ws.send(
		JSON.stringify({
			type: 'active_articles',
			data: activeArticles.filter(Boolean)
		})
	);
}

const server = Bun.serve<WebSocketData>({
	port: Number(process.env.PORT) || 8080,

	async fetch(request, server) {
		const authResult = await validateAuth(request);
		const url = new URL(request.url);

		if (authResult?.isBanned) {
			return new Response('User is banned', { status: 403 });
		}

		const connectionType = authResult
			? url.searchParams.get('type') === 'editor' ? 'editor' : 'viewer'
			: undefined;

		if (authResult && connectionType === 'editor') {
			const existingEditorSocket = editorSockets.get(authResult.id);
			if (existingEditorSocket) {
				existingEditorSocket.close(4000, 'New editor connection opened elsewhere');
			}
		}

		const upgraded = server.upgrade(request, {
			data: {
				user: authResult || undefined,
				articleId: null,
				connectionType
			}
		});

		return upgraded ? undefined : new Response('Upgrade failed', { status: 500 });
	},

	websocket: {
		async message(ws, msg) {
			if (typeof msg !== 'string') return;

			try {
				const data = JSON.parse(msg) as { type: string; article?: any };
				switch (data.type) {
					case 'set_article':
						if (data.article) {
							await handleSetArticle(ws, data.article.id);
						}
						break;
					case 'get_active_articles':
						await handleGetActiveArticles(ws);
						break;
				}
			} catch (error) {
				console.error('Message handling error:', error);
			}
		},

		close(ws) {
			if (ws.data.articleId && ws.data.user) {
				const userId = ws.data.user.id;

				if (ws.data.connectionType === 'editor') {
					const currentEditorSocket = editorSockets.get(userId);
					if (currentEditorSocket === ws) {
						editorSockets.delete(userId);
					}
				}

				const sockets = userSockets.get(userId);
				if (sockets) {
					sockets.delete(ws);
					if (sockets.size === 0) {
						userSockets.delete(userId);
						const users = articleUsers.get(ws.data.articleId);
						if (users) {
							users.delete(userId);
							if (users.size === 0) {
								articleUsers.delete(ws.data.articleId);
							}

							broadcastUserCount(ws.data.articleId);

							const message = JSON.stringify({
								type: 'user_disconnected',
								data: { editorId: userId }
							});

							Array.from(users)
								.flatMap((uid) => Array.from(userSockets.get(uid) || []))
								.forEach((socket) => {
									if (socket !== ws) socket.send(message);
								});
						}
					}
				}
			}
		}
	}
});

console.log(`WebSocket server is running on port ${server.port}`);