import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { articles as articlesTable } from '$lib/server/db/schema';
import { gt, desc } from 'drizzle-orm';

let cachedSitemap: string | null = null;
let cachedAt = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in ms

export const GET: RequestHandler = async () => {
    const now = Date.now();
    if (cachedSitemap && now - cachedAt < CACHE_DURATION) {
        return new Response(cachedSitemap, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=600'
            }
        });
    }

    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const recentArticles = await db.select().from(articlesTable)
        .where(gt(articlesTable.updated_at, oneDayAgo))
        .orderBy(desc(articlesTable.updated_at))
        .limit(3000);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${recentArticles.map(article => `
    <url>
      <loc>https://bliptext.com/articles/${article.slug}</loc>
      <lastmod>${(article.updated_at || article.created_at).toISOString()}</lastmod>
      <changefreq>hourly</changefreq>
    </url>`).join('')}
  </urlset>`;

    cachedSitemap = xml;
    cachedAt = now;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=600'
        }
    });
};
