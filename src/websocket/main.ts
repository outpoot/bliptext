import type { ServerWebSocket } from "bun";
import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

export type WebSocketData = {
    currentArticle?: string;
    user: {
        id: string;
    };
};

const redis = new Redis(process.env.REDIS_URL!);
const sockets = new Set<ServerWebSocket<WebSocketData>>();
const activeArticles = new Map<string, Set<string>>();
const subscribedArticles = new Set<string>();

redis.on("message", (channel, msg) => {
    if (!channel.startsWith("updates:")) return;
    const article = channel.substring(8);

    for (const socket of sockets) {
        if (socket.data.currentArticle === article) {
            socket.send(msg);
        }
    }
});

redis.on('error', console.error);

async function validateAuth(request: Request) {
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

async function broadcastActiveUsers(articleId: string) {
    const count = activeArticles.get(articleId)?.size ?? 0;
    const message = JSON.stringify({ type: 'active_users_update', data: { count } });

    for (const socket of sockets) {
        if (socket.data.currentArticle === articleId) {
            socket.send(message);
        }
    }
}

async function handleSetArticle(ws: ServerWebSocket<WebSocketData>, article: string) {
    ws.data.currentArticle = article;

    if (!activeArticles.has(article)) {
        activeArticles.set(article, new Set());
    }
    activeArticles.get(article)?.add(ws.data.user.id);

    if (!subscribedArticles.has(article)) {
        subscribedArticles.add(article);
        await redis.subscribe("updates:" + article);
    }

    await broadcastActiveUsers(article);
}

async function handleGetActiveArticles(ws: ServerWebSocket<WebSocketData>) {
    const activeArticlesData = [];

    for (const [articleId, users] of activeArticles) {
        if (users.size > 0) {
            try {
                const response = await fetch(`${process.env.SITE_URL}/api/articles/${articleId}?byId=true`);
                if (response.ok) {
                    const article = await response.json();
                    activeArticlesData.push({ ...article, activeUsers: users.size });
                }
            } catch (error) {
                console.error('Failed to fetch article:', error);
            }
        }
    }

    ws.send(JSON.stringify({ type: "active_articles", data: activeArticlesData }));
}

const server = Bun.serve<WebSocketData>({
    port: Number(process.env.PORT) || 8080,
    async fetch(request, server) {
        const user = await validateAuth(request);
        if (!user) return new Response(null, { status: 401 });

        const upgraded = server.upgrade(request, {
            data: { user, currentArticle: null }
        });

        return upgraded
            ? undefined
            : new Response("Upgrade failed", { status: 500 });
    },
    websocket: {
        open(ws) {
            sockets.add(ws);
        },
        async message(ws, msg) {
            if (typeof msg !== "string") return;

            try {
                const data = JSON.parse(msg);

                switch (data.type) {
                    case "set_article":
                        await handleSetArticle(ws, data.article);
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
            const articleId = ws.data.currentArticle;
            if (articleId) {
                activeArticles.get(articleId)?.delete(ws.data.user.id);

                if (activeArticles.get(articleId)?.size === 0) {
                    activeArticles.delete(articleId);
                }

                broadcastActiveUsers(articleId);

                const message = JSON.stringify({
                    type: 'user_disconnected',
                    data: { editorId: ws.data.user.id }
                });

                for (const socket of sockets) {
                    if (socket.data.currentArticle === articleId && socket !== ws) {
                        socket.send(message);
                    }
                }
            }
            sockets.delete(ws);
        },
    },
});

console.log(`WebSocket server is running on port ${server.port}`);