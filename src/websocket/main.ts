import type { ServerWebSocket } from "bun";
import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

type WebSocketData = {
    articleId?: string;
    user: {
        id: string;
    };
};

// types
const redis = new Redis(process.env.REDIS_URL!);
const articleUsers = new Map<string, Set<string>>();
const userSockets = new Map<string, Set<ServerWebSocket<WebSocketData>>>();

redis.on("message", (channel, msg) => {
    if (!channel.startsWith("updates:")) return;
    const articleId = channel.substring(8);

    // Send updates to all sockets viewing this article
    Array.from(articleUsers.get(articleId) || [])
        .flatMap(userId => Array.from(userSockets.get(userId) || []))
        .forEach(socket => socket.send(msg));
});

redis.on('error', console.error);

async function validateAuth(request: Request): Promise<{ id: string } | null> {
    const token = new URL(request.url).searchParams.get("token");
    if (!token) return null;

    try {
        const res = await fetch(`${process.env.SITE_URL}/api/auth/get-session`, {
            headers: new Headers(request.headers),
            credentials: 'include'
        });

        if (!res.ok) return null;
        const data = await res.json();
        return data?.user?.id ? { id: data.user.id } : null;
    } catch {
        return null;
    }
}

async function broadcastUserCount(articleId: string): Promise<void> {
    const count = articleUsers.get(articleId)?.size ?? 0;
    const message = JSON.stringify({
        type: 'active_users_update',
        data: { count }
    });

    // send count to all sockets viewing the article
    Array.from(articleUsers.get(articleId) || [])
        .flatMap(userId => Array.from(userSockets.get(userId) || []))
        .forEach(socket => socket.send(message));
}

async function handleSetArticle(ws: ServerWebSocket<WebSocketData>, articleId: string): Promise<void> {
    const userId = ws.data.user.id;

    // remove from previous article if exists
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

    // add to new article
    ws.data.articleId = articleId;

    // track user sockets
    if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set([ws]));
    } else {
        userSockets.get(userId)!.add(ws);
    }

    // track article users
    if (!articleUsers.has(articleId)) {
        articleUsers.set(articleId, new Set([userId]));
        await redis.subscribe("updates:" + articleId);
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
                    const response = await fetch(`${process.env.SITE_URL}/api/articles/${articleId}?byId=true`);
                    if (!response.ok) return null;

                    const article = await response.json();
                    return {
                        ...article,
                        activeUsers: articleUsers.get(articleId)?.size ?? 0
                    };
                } catch (error) {
                    console.error('Failed to fetch article:', error);
                    return null;
                }
            })
    );

    ws.send(JSON.stringify({
        type: "active_articles",
        data: activeArticles.filter(Boolean)
    }));
}

const server = Bun.serve<WebSocketData>({
    port: Number(process.env.PORT) || 8080,

    async fetch(request, server) {
        const user = await validateAuth(request);
        if (!user) return new Response(null, { status: 401 });

        const upgraded = server.upgrade(request, {
            data: { user, articleId: null }
        });

        return upgraded
            ? undefined
            : new Response("Upgrade failed", { status: 500 });
    },

    websocket: {
        async message(ws, msg) {
            if (typeof msg !== "string") return;

            try {
                const data = JSON.parse(msg) as { type: string; article?: string };
                switch (data.type) {
                    case "set_article":
                        if (data.article) {
                            await handleSetArticle(ws, data.article);
                        }
                        break;
                    case "get_active_articles":
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
                                .flatMap(uid => Array.from(userSockets.get(uid) || []))
                                .forEach(socket => {
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