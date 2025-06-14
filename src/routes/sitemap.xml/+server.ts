import type { RequestHandler } from '@sveltejs/kit';

const STATIC_URLS = [
    '/',
    '/home',
    '/legal/about',
    '/legal/privacy',
    '/legal/terms',
    '/search'
];

export const GET: RequestHandler = async () => {
    const now = new Date().toISOString();
    const staticUrlsXml = STATIC_URLS.map(url => `
        <url>
            <loc>https://bliptext.com${url}</loc>
            <lastmod>${now}</lastmod>
        </url>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
        ${staticUrlsXml}
        <url>
            <loc>https://bliptext.com/sitemap/recent.xml</loc>
            <lastmod>${now}</lastmod>
        </url>
    </urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=86400'
        }
    });
};