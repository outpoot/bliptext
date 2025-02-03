export function decodeWikiUrl(url: string) {
    if (!url) return url;
    return url.replace(/\/\/\//g, '_');
}

export async function transformWikiImageUrl(url: string): Promise<{ primary: string, fallback: string | null }> {
    if (!url) return { primary: url, fallback: null };
    
    url = !url.startsWith('https://') ? `https://${url}` : url;
    url = decodeWikiUrl(url);

    if (url.includes('wikimedia.org/wikipedia/')) {
        const parts = url.split('/');
        const wikiIndex = parts.findIndex(p => p === 'wikipedia');
        const type = parts[wikiIndex + 1];
        const hash = parts[wikiIndex + 2];
        const subHash = parts[wikiIndex + 3];
        const filename = parts[parts.length - 1];
        const pathPrefix = parts.slice(0, wikiIndex + 1).join('/');

        const makeUrl = (t: string) => {
            const suffix = filename.toLowerCase().endsWith('.svg') ? '.png' : '';
            return `${pathPrefix}/${t}/thumb/${hash}/${subHash}/${filename}/330px-${filename}${suffix}`;
        };

        return {
            primary: makeUrl(type),
            fallback: type === 'commons' ? makeUrl('en') : makeUrl('commons')
        };
    }

    return { primary: url, fallback: null };
}
