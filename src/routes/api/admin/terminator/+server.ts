import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { auth } from '$lib/auth';
import { sql } from 'drizzle-orm';
import { session, user } from '$lib/server/db/schema';
import { createHash } from 'crypto';

function maskIP(ip: string): string {
    const hash = createHash('sha256')
        .update(ip + process.env.JWT_SECRET)
        .digest('hex');
    return 'G-' + hash.substring(0, 8);
}

type MultiUserIP = {
    ip_address: string;
    account_count: number;
    users: Array<{
        id: string;
        name: string;
        image: string | null;
        isBanned: boolean;
        createdAt: string;
    }>;
};

export async function GET({ request }) {
    const userSession = await auth.api.getSession({
        headers: request.headers
    });

    if (!userSession?.user?.isAdmin) {
        throw error(403, 'Not authorized');
    }

    try {
        const multiUserIPs = await db.execute<MultiUserIP>(sql`
            SELECT
                ${session.ipAddress} AS ip_address,
                COUNT(DISTINCT ${session.userId})::int AS account_count,
                jsonb_agg(DISTINCT jsonb_build_object(
                    'id', ${user.id},
                    'name', ${user.name},
                    'image', ${user.image},
                    'isBanned', ${user.isBanned},
                    'createdAt', ${user.createdAt}
                )) AS users
            FROM ${session}
            INNER JOIN ${user} ON ${user.id} = ${session.userId}
            WHERE ${session.ipAddress} IS NOT NULL
            GROUP BY ${session.ipAddress}
            HAVING
                COUNT(DISTINCT ${session.userId}) > 1
                AND bool_or(${user.isBanned} = false)
            ORDER BY account_count DESC
        `);

        if (!multiUserIPs || !Array.isArray(multiUserIPs)) {
            return json([], {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, private'
                }
            });
        }

        const results = multiUserIPs.map((ipGroup) => ({
            groupId: maskIP(ipGroup.ip_address),
            account_count: ipGroup.account_count,
            users: ipGroup.users
        }));

        return json(results, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, private'
            }
        });
    } catch (err) {
        console.error('Failed to fetch terminator data:', err);
        throw error(500, 'Failed to fetch data');
    }
}
