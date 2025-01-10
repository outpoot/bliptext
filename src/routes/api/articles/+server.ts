// TODO: user auth

import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles } from '$lib/server/db/schema';
import { slugify } from '$lib/utils';
import { getUserFromRequest } from '$lib/server/jwt';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies }) => {
    const user = await getUserFromRequest(request, cookies);
    const { title, content } = await request.json();

    if (!title || !content) {
        return json({ error: 'Title and content are required' }, { status: 400 });
    }

    const slug = slugify(title);

    try {
        const [article] = await db.insert(articles)
            .values({
                title,
                content,
                slug,
                createdBy: user.id
            })
            .returning();

        return json(article);
    } catch (error) {
        return json({ error: 'Failed to create article' }, { status: 500 });
    }
}
