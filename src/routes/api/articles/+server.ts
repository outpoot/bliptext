import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles } from '$lib/server/db/schema';
import { slugify } from '$lib/utils';

export async function POST({ request }) {
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
                slug
            })
            .returning();

        return json(article);
    } catch (error) {
        console.log(error)
        return json({ error: 'Failed to create article' }, { status: 500 });
    }
}
