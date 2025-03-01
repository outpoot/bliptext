import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from '$env/dynamic/private';
import { db } from "$lib/server/db";

if (!env.DISCORD_CLIENT_ID) throw new Error('DISCORD_CLIENT_ID is not set');
if (!env.DISCORD_CLIENT_SECRET) throw new Error('DISCORD_CLIENT_SECRET is not set');

export const auth = betterAuth({
    baseURL: env.PUBLIC_BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    appName: "Bliptext",
    trustedOrigins: env.TRUSTED_ORIGINS?.split(',') || [],

    database: drizzleAdapter(db, {
        provider: "pg",
    }),
    socialProviders: {
        discord: {
            clientId: env.DISCORD_CLIENT_ID,
            clientSecret: env.DISCORD_CLIENT_SECRET,
        }
    },

    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // 5 minutes
        }
    },
    user: {
        additionalFields: {
            isAdmin: {
                type: "boolean",
                required: true,
                defaultValue: false,
                input: false
            },
            isBanned: {
                type: "boolean",
                required: true,
                defaultValue: false,
                input: false
            },
        }
    },
});