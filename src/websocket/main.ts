import type { ServerWebSocket } from "bun";
import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });
const redis = new Redis(process.env.REDIS_URL!);

export type WebSocketData = {
    currentArticle?: string;
    user: {
        id: string;
    };
};

let sockets: ServerWebSocket<WebSocketData>[] = [];
let subscribedToArticles: string[] = [];

redis.on("message", async (channel, msg) => {
    if (!channel.startsWith("updates:")) return;
    const article = channel.substring(8);

    const clients = sockets.filter(
        (socket) => socket.data.currentArticle == article
    );

    for (const client of clients) {
        client.send(msg);
    }
});

redis.on('error', function (error) {
    console.dir(error);
});

const server = Bun.serve<WebSocketData>({
    port: process.env.PORT || 8080,
    async fetch(request, server) {
        try {
            const url = new URL(request.url);
            const token = url.searchParams.get("token");

            if (!token) {
                return new Response(null, { status: 401 });
            }

            const headers = new Headers(request.headers);

            const res = await fetch(`${process.env.SITE_URL}/api/auth/get-session`, {
                headers,
                credentials: 'include'
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error('Auth failed:', errorText);
                return new Response(null, { status: 401 });
            }

            const data = await res.json();

            if (!data || !data.user || !data.user.id) {
                return new Response(null, { status: 401 });
            }

            if (
                server.upgrade(request, {
                    data: {
                        currentArticle: null,
                        user: {
                            id: data.user.id
                        },
                    },
                })
            ) {
                return;
            }

            return new Response("Upgrade failed", { status: 500 });
        } catch (error) {
            return new Response(null, { status: 500 });
        }
    },
    websocket: {
        open: async (ws) => {
            sockets.push(ws);
        },
        message: async (ws, msg) => {
            if (typeof msg !== "string") return;

            const data = JSON.parse(msg);

            switch (data.type) {
                case "set_article":
                    ws.data.currentArticle = data.article;
                    if (!subscribedToArticles.includes(data.article)) {
                        subscribedToArticles.push(data.article);
                        redis.subscribe("updates:" + data.article);
                    }
                    break;

                default:
                    console.log("Received unknown event type " + data.type);
            }
        },
        close: async (ws) => {
            if (ws.data.currentArticle) {
                const clients = sockets.filter(
                    (socket) => socket.data.currentArticle === ws.data.currentArticle && socket !== ws
                );

                for (const client of clients) {
                    client.send(JSON.stringify({
                        type: 'user_disconnected',
                        data: {
                            editorId: ws.data.user.id
                        }
                    }));
                }
            }

            sockets = sockets.filter((a) => a !== ws);
        },
    },
});

console.log(`WebSocket server is running on port ${server.port}`);