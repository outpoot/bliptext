const wtf = require('wtf_wikipedia');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const fetch = require('node-fetch');

// Configure connection pooling
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 20 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 20 });

// Precompiled regex patterns
const REGEX_PATTERNS = {
    slugInvalid: /[^a-z0-9]+/g,
    edgeDashes: /(^-|-$)/g,
    filePrefix: /^(File|Image):/i,
    spaces: / /g,
    multipleUnderscores: /_+/g,
    extension: /\.(jpe?g|png|svg)$/i,
    formatting: /%20|'|\(|\)/g
};

const IMAGE_KEYS = ['image', 'logo', 'photo', 'cover', 'picture'];
const CACHE = new Map();
const REQUEST_TIMEOUT = 2000;

// Helper functions
function slugify(text) {
    return String(text)
        .toLowerCase()
        .replace(REGEX_PATTERNS.slugInvalid, '-')
        .replace(REGEX_PATTERNS.edgeDashes, '');
}

function processLinks(text, links) {
    let processed = text;
    links?.forEach(link => {
        const target = `https://bliptext.com/articles/${slugify(link.page)}`;
        const display = (link.text || link.page).replace(/_/g, ' ');
        processed = processed.replace(
            new RegExp(escapeRegExp(link.text || link.page), 'g'),
            `[${display}](${target})`
        );
    });
    return processed;
}

function processFormatting(text, formatting) {
    let processed = text;
    formatting?.bold?.forEach(boldText => {
        processed = processed.replace(
            new RegExp(escapeRegExp(boldText), 'g'),
            `**${boldText}**`
        );
    });
    return processed;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Image processing
function processImage(img) {
    const originalFilename = img?.file || '';
    const cleanFilename = originalFilename
        .replace(/^(File|Image):/i, '')
        .trim()
        .replace(/([([{])(\s+|_+)|(\s+|_+)([)\]}])/g, (_, open, after, before, close) => open || close)
        .replace(/ /g, '_')
        .replace(/_+/g, '_');

    if (!/\.(jpe?g|png|svg)$/i.test(cleanFilename)) return null;

    const hash = crypto.createHash('md5').update(cleanFilename).digest('hex');
    const safeFilename = encodeURIComponent(cleanFilename)
        .replace(/%20|'|\(|\)/g, m => ({ '%20': '_', "'": '%27', '(': '%28', ')': '%29' }[m]))
        .replace(/_/g, '///');

    return {
        cleanFilename,
        dir1: hash[0],
        dir2: hash.slice(0, 2),
        safeFilename
    };
}

async function buildImagePath(img) {
    const processed = processImage(img);
    if (!processed) return null;

    const { cleanFilename, dir1, dir2, safeFilename } = processed;

    if (CACHE.has(cleanFilename)) {
        return CACHE.get(cleanFilename);
    }

    const urls = [
        `https://upload.wikimedia.org/wikipedia/commons/${dir1}/${dir2}/${safeFilename}`,
        `https://upload.wikimedia.org/wikipedia/en/${dir1}/${dir2}/${safeFilename}`
    ];

    const checkPromise = (async () => {
        try {
            const validUrls = await Promise.all(urls.map(checkUrl));
            const validIndex = validUrls.findIndex(Boolean);
            const result = validIndex >= 0 ? urls[validIndex] : urls[0];
            CACHE.set(cleanFilename, result);
            return result;
        } catch (e) {
            CACHE.set(cleanFilename, urls[0]);
            return urls[0];
        }
    })();

    CACHE.set(cleanFilename, checkPromise);
    return checkPromise;
}

async function checkUrl(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
        const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'manual',
            signal: controller.signal,
            agent: url.startsWith('https') ? httpsAgent : httpAgent
        });
        return response.status === 200;
    } catch {
        return false;
    } finally {
        clearTimeout(timeout);
    }
}

function camelToTitleCase(key) {
    // Handle special cases first
    if (key.toLowerCase() === 'url') return 'URL';
    if (key.toLowerCase() === 'iso3166code') return 'ISO 3166 Code';

    // Split into words using character case transitions
    let words = [];
    let currentWord = [];

    for (const char of key) {
        if (char === '_') {
            words.push(currentWord.join(''));
            currentWord = [];
            continue;
        }

        if (currentWord.length > 0 &&
            char === char.toUpperCase() &&
            currentWord[currentWord.length - 1] !== ' ') {
            words.push(currentWord.join(''));
            currentWord = [];
        }

        currentWord.push(char);
    }

    words.push(currentWord.join(''));

    // Capitalize first letter of each word and join
    return words
        .filter(w => w)
        .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

// Main conversion function
async function convertWikiToMD(wikiText) {
    const doc = wtf(wikiText);
    const json = doc.json();

    // Parallel image processing
    const allImages = [];
    let infobox = null;

    // Collect images and find infobox
    for (const section of json.sections || []) {
        if (section.infoboxes?.length && !infobox) {
            infobox = section.infoboxes.find(box =>
                Object.keys(box).length > 1 && !box.child && !('embed' in box)
            );
        }
        if (section.images?.length) {
            allImages.push(...section.images);
        }
    }

    // Add infobox image
    if (infobox) {
        for (const key of IMAGE_KEYS) {
            const imageData = infobox[key];
            if (imageData?.file || imageData?.text) {
                allImages.push({ file: imageData.file || imageData.text });
                break;
            }
        }
    }

    // Process all images in parallel
    await Promise.all(
        allImages.map(img =>
            buildImagePath(img).catch(e => {
                console.error(`Image processing error: ${img.file}`, e);
                return null;
            })
        )
    );

    // Generate content
    let summary = ':::summary\n';

    // Process infobox
    if (infobox) {
        let imageFile = null;
        for (const key of IMAGE_KEYS) {
            const imageData = infobox[key];
            if (imageData?.file || imageData?.text) {
                imageFile = imageData.file || imageData.text;
                break;
            }
        }

        if (imageFile) {
            try {
                const imgPath = await buildImagePath({ file: imageFile });
                if (imgPath) {
                    const caption = processFormatting(
                        infobox.caption?.text || infobox.name?.text || json.title,
                        {}
                    );
                    summary += `![${caption}](${imgPath})\n`;
                }
            } catch (e) {
                console.error(`Failed to process image: ${imageFile}`, e);
            }
        }

        const excludeKeys = new Set([...IMAGE_KEYS, 'caption', 'alt', 'signature', 'signature_alt']);
        for (const [key, value] of Object.entries(infobox)) {
            if (excludeKeys.has(key) || typeof value !== 'object' || !value.text) continue;

            const cleanKey = key.replace(/_/g, ' ')
                .replace(/(?:^|\s)(\w)/g, (_, letter) => letter.toUpperCase())
                .replace(/\s+/g, '');

            let cleanValue = processLinks(value.text, value.links);
            cleanValue = processFormatting(cleanValue, value.formatting || {})
                .split('\n')
                .map(line => {
                    // Remove list markers and any residual formatting artifacts
                    return line
                        .replace(/^\s*([*\-]+\s*)+/, '') // Remove list markers and their whitespace
                        .replace(/\s*\*+$/, '') // Remove trailing asterisks used in formatting
                        .trim();
                })
                .filter(line => line)
                .join(' · ');

            summary += `**${camelToTitleCase(cleanKey)}:** ${cleanValue}  \n`;
        }
    }

    summary += ':::\n\n';

    // Process sections
    const excludedSections = new Set([
        'references', 'see also', 'external links',
        'notes', 'works cited', 'bibliography',
        'further reading'
    ].map(s => s.toLowerCase()));

    const content = [];
    for (const section of json.sections || []) {
        const title = section.title?.trim() || '';
        if (excludedSections.has(title.toLowerCase())) continue;

        const headerDepth = Math.min((section.depth || 0) + 1, 6);
        let sectionContent = [`${'#'.repeat(headerDepth)} ${title}`];

        // Process paragraphs
        for (const paragraph of section.paragraphs || []) {
            for (const sentence of paragraph.sentences || []) {
                if (typeof sentence.text !== 'string') continue;
                let text = processFormatting(sentence.text, sentence.formatting || {});
                text = processLinks(text, sentence.links);
                sectionContent.push(text);
            }
        }

        // Process images in parallel
        if (section.images?.length) {
            const imagePromises = section.images.map(img =>
                buildImagePath(img).catch(() => null)
            );
            const imageResults = await Promise.all(imagePromises);

            imageResults.forEach((imgPath, index) => {
                if (imgPath) {
                    const img = section.images[index];
                    const caption = processFormatting(img.caption || json.title, {});
                    sectionContent.push(`# [${caption} | ${imgPath.replace(/^https?:\/\//, '')}]`);
                }
            });
        }

        content.push(sectionContent.join('\n'));
    }

    return summary + content.join('\n\n');
}

export default convertWikiToMD;