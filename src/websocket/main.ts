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
    console.dir(error)
})

const server = Bun.serve<WebSocketData>({
    port: process.env.PORT || 3000,
    async fetch(request, server) {
        const url = new URL(request.url);

        const token = url.searchParams.get("token");
        if (!token) return new Response(null, { status: 401 });

        const res = await fetch(`${process.env.SITE_URL}/api/me`, {
            headers: {
                Cookie: `better-auth.session_token=${token}`,
            },
        });

        if (!res.ok) return new Response(null, { status: 401 });

        const user = await res.json();

        if (
            server.upgrade(request, {
                data: {
                    currentArticle: null,
                    user,
                },
            })
        ) {
            return;
        }

        return new Response("Upgrade failed", { status: 500 });
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
            sockets = sockets.filter((a) => a !== ws);
        },
    },
});

console.log(`WebSocket server is running on port ${server.port}`);