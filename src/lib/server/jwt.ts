import { error, type Cookies } from "@sveltejs/kit";
import * as jose from "jose";
import { user, authTokens } from './db/schema';
import { db } from './db';
import { env } from '$env/dynamic/private';

import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export type JWTPayload = {
    userId: string;
    code: string;
    exp: number;
    timestamp: number;
};

export const codes = new Set();

export function generateSecureCode(length = 16) {
    return crypto.randomBytes(length).toString('hex');
}

export async function fillCodes() {
    const codesResults = await db.select({ code: authTokens }).from(authTokens)

    for (const { code } of codesResults) {
        codes.add(code.token)
    }
}

export const createAuthJWT = async (data: JWTPayload) => {
    const jwt = await new jose.SignJWT(data)
        .setProtectedHeader({ alg: "HS256" })
        .sign(new TextEncoder().encode(env.JWT_SECRET));

    return jwt;
};

export const verifyAuthJWT = async (token: string) => {
    try {
        const { payload } = await jose.jwtVerify(
            token,
            new TextEncoder().encode(env.JWT_SECRET)
        );

        const userData = await db.select().from(user).where(eq(user.id, payload.userId as string)).limit(1);

        if (!userData[0]) {
            throw error(401, "Invalid token.");
        }

        return { payload: payload as JWTPayload, user: userData[0] };
    } catch (error) {
        throw error
    }
};

export const deleteJWT = async (token: string) => {
    try {
        const { payload } = await jose.jwtVerify(
            token,
            new TextEncoder().encode(env.JWT_SECRET)
        ).catch(error => {
            throw error(500, error)
        });

        const result = await db.delete(authTokens)
            .where(eq(authTokens.token, (payload as JWTPayload).code))
            .returning();

        if (!result.length) {
            throw error(404, "Token not found");
        }

        return true;
    } catch {
        throw error(500, "Error deleting token.");
    }
};

export async function decodeJwt(authCookie: string | undefined) {
    if (!authCookie) return;

    try {
        const { payload } = await verifyAuthJWT(authCookie);

        if (!payload.userId || !payload.code || !payload.timestamp || !codes.has(payload.code)) {
            throw new Error('Invalid JWT token');
        }

        return payload;
    } catch (error) {
        return
    }
}

export async function getUserFromRequest(request: Request, cookies: Cookies) {
    const authHeader = request.headers.get('Authorization');
    const cookieToken = cookies.get('_TOKEN__DO_NOT_SHARE');
    const token = authHeader ? authHeader.replace('Bearer ', '') : cookieToken;

    if (!token) {
        throw error(401, 'Unauthorized');
    }

    try {
        const { payload, user } = await verifyAuthJWT(token);
        if (!payload || payload.exp < new Date().getTime()) {
            throw error(401, 'Token expired');
        }
        return user;
    } catch {
        throw error(401, 'Invalid token');
    }
}