import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { auth } from '$lib/auth';
import { sql, inArray } from 'drizzle-orm';
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
    user_count: number;
    user_ids: string[];
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
            WITH MultiUserIPs AS (
                SELECT 
                    ip_address,
                    COUNT(DISTINCT user_id) as user_count,
                    array_agg(DISTINCT user_id) as user_ids
                FROM ${session} 
                GROUP BY ip_address
                HAVING COUNT(DISTINCT user_id) > 1
                ORDER BY COUNT(DISTINCT user_id) DESC
            )
            SELECT * FROM MultiUserIPs
        `);

        if (!multiUserIPs || !Array.isArray(multiUserIPs)) {
            return json([], {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, private'
                }
            });
        }

        const results = await Promise.all(
            multiUserIPs.map(async (ipGroup: MultiUserIP) => {
                const users = await db
                    .select({
                        id: user.id,
                        name: user.name,
                        image: user.image,
                        isBanned: user.isBanned,
                        createdAt: user.createdAt
                    })
                    .from(user)
                    .where(inArray(user.id, ipGroup.user_ids));

                const allBanned = users.every(u => u.isBanned);
                if (allBanned) {
                    return null;
                }

                return {
                    groupId: maskIP(ipGroup.ip_address),
                    account_count: ipGroup.user_count,
                    users
                };
            })
        );

        const filteredResults = results.filter(Boolean);

        return json(filteredResults, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, private'
            }
        });
    } catch (err) {
        console.error('Failed to fetch terminator data:', err);
        throw error(500, 'Failed to fetch data');
    }
}
