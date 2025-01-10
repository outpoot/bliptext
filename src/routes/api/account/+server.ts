import { json, type Cookies, type RequestHandler } from "@sveltejs/kit";
import { user, authTokens } from "$lib/server/db/schema";
import { db } from "$lib/server/db";
import { codes, createAuthJWT, generateSecureCode } from "$lib/server/jwt";
import { eq } from "drizzle-orm"
import { checkHardcore } from "../moderation";
import { auth } from "$lib/auth";

export const POST: RequestHandler = async ({
    request,
    cookies,
}: {
    request: Request;
    cookies: Cookies;
}) => {
    try {
        const ip = request.headers.get('CF-Connecting-IP') ?? '127.0.0.1'

        // TODO: pentest here, seems like a potential security issue
        const session = await auth.api.getSession({
            headers: request.headers
        })

        const email = session?.user.email;
        const userId = session?.user.id;

        if (!email || !userId) {
            return json({ error: 'User is not authenticated.' }, { status: 400 });
        }

        // if (checkHardcore(body.handle) || checkHardcore(body.username)) {
        //     return json(
        //         { error: 'Handle or username have been denied by our filters. This may include usage of possible slurs. If you believe this is a mistake, try altering your ipnut. Attempting to bypass these filters maliciously will result in consequences.' },
        //         { status: 400 }
        //     );
        // }

        const uniqueCode = generateSecureCode();

        const expireDate = Date.now() + 1000 * 60 * 60 * 24 * 7;

        const jwt = await createAuthJWT({
            userId,
            timestamp: Date.now(),
            exp: expireDate,
            code: uniqueCode
        });

        await db
            .insert(authTokens)
            .values({
                token: uniqueCode,
                userId,
                ip: ip,
                userAgent: request.headers.get('user-agent') || '',
                expiresAt: new Date(expireDate), // 7 days
            })
            .returning();

        codes.add(uniqueCode)

        cookies.set('_TOKEN__DO_NOT_SHARE', jwt, {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 604800
        });

        return json({}, { status: 201 });
    } catch (error) {
        console.error('Error fetching user:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}