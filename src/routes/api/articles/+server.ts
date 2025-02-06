import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles } from '$lib/server/db/schema';
import { slugify } from '$lib/utils';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';

export const POST: RequestHandler = async ({ request, setHeaders }) => {
    setHeaders({
        'cache-control': 'private, no-cache, no-store, must-revalidate'
    });

    const session = await auth.api.getSession({
        headers: request.headers
    })

    const userId = session?.user.id;

    const { title, content } = await request.json();

    if (!session?.user.isAdmin) {
        return json({ error: "You must be an admin to create a new post" }, { status: 401 })
    }
    if (!title || !content || !userId) {
        return json({ error: 'Title and content are required' }, { status: 400 });
    }

    const slug = slugify(title);

    try {
        const [article] = await db.insert(articles)
            .values({
                title,
                content,
                slug,
                created_by: userId,
                search_content: `${title} ${content}`.toLowerCase()
            })
            .returning();

        return json(article);
    } catch (error) {
        return json({ error: 'Failed to create article' }, { status: 500 });
    }
}
