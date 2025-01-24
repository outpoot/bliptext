const wtf = require('wtf_wikipedia');
const crypto = require('crypto');

function slugify(text) {
    return String(text)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function processLinks(text, links) {
    let processed = text;
    links?.forEach(link => {
        const target = `https://bliptext.com/articles/${slugify(link.page)}`;
        const display = link.text ? link.text.replace(/_/g, ' ') : link.page.replace(/_/g, ' ');
        processed = processed.replace(new RegExp(escapeRegExp(link.text || link.page), 'g'), `[${display}](${target})`);
    });
    return processed;
}

function processFormatting(text, formatting) {
    let processed = text;
    if (formatting?.bold) {
        formatting.bold.forEach(boldText => {
            const escaped = escapeRegExp(boldText);
            processed = processed.replace(new RegExp(escaped, 'g'), `**${boldText}**`);
        });
    }
    return processed;
}

function buildImagePath(img) {
    const originalFilename = (typeof img === 'object' && 'file' in img && typeof img.file === 'string')
        ? img.file
        : String(img?.file || '');

    const cleanFilename = originalFilename
        .replace(/^File:/i, '')
        .replace(/ /g, '_');

    if (!cleanFilename) return null;

    const allowedExtensions = /\.(jpg|jpeg|png|svg)$/i;
    if (!allowedExtensions.test(cleanFilename)) return null;

    const hash = crypto.createHash('md5').update(cleanFilename).digest('hex');
    const dir1 = hash[0];
    const dir2 = hash.slice(0, 2);

    const safeFilename = encodeURIComponent(cleanFilename)
        .replace(/%20/g, '_')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/_/g, '///');

    const finalFilename = cleanFilename.endsWith('.svg')
        ? safeFilename + '.png'
        : safeFilename;

    return `upload.wikimedia.org/wikipedia/commons/thumb/${dir1}/${dir2}/${safeFilename}/330px-${finalFilename}`;
}

async function convertWikiToMD(wikiText) {
    const doc = wtf(wikiText);
    const json = doc.json();

    let summary = ':::summary\n';

    let infobox = null;
    for (const section of json.sections || []) {
        if (section.infoboxes?.length) {
            infobox = section.infoboxes.find(box =>
                Object.keys(box).length > 1 && !box.child
            );
            if (infobox) break;
        }
    }

    if (infobox) {
        const logo = infobox.logo?.text || infobox.image?.text;

        if (logo) {
            const imgPath = buildImagePath({ file: logo });
            if (imgPath) {
                const caption = infobox.name?.text || json.title;
                summary += `![${caption}](${imgPath})\n`;
            }
        }

        const excludeKeys = new Set(['image', 'caption', 'alt', 'signature', 'signature_alt']);
        Object.entries(infobox).forEach(([key, value]) => {
            if (excludeKeys.has(key) || typeof value !== 'object' || !value.text) return;

            const cleanKey = key.replace(/_/g, ' ')
                .replace(/(?:^|\s)(\w)/g, (_, letter) => letter.toUpperCase())
                .replace(/\s+/g, '');

            let cleanValue = processFormatting(value.text, value.formatting || {});
            cleanValue = processLinks(cleanValue, value.links)
                .replace(/\n+/g, '  \n');

            summary += `**${cleanKey}:** ${cleanValue}  \n`;
        });
    }

    summary += ':::\n\n';

    let content = [];
    const excludedSections = new Set([
        'references', 'see also', 'external links',
        'notes', 'works cited', 'bibliography',
        'further reading', 'external links'
    ].map(s => s.toLowerCase()));

    (json.sections || []).forEach(section => {
        const title = section.title?.trim() || '';
        if (excludedSections.has(title.toLowerCase())) return;

        const headerDepth = Math.min((section.depth || 0) + 1, 6);
        const header = '#'.repeat(headerDepth);

        let sectionContent = [`${header} ${title}`];

        (section.paragraphs || []).forEach(paragraph => {
            (paragraph.sentences || []).forEach(sentence => {
                if (typeof sentence.text !== 'string') return;
                let text = processFormatting(sentence.text, sentence.formatting || {});
                text = processLinks(text, sentence.links);
                sectionContent.push(text);
            });
        });

        (section.images || []).forEach(img => {
            const imgPath = buildImagePath(img);
            if (imgPath) {
                const caption = processFormatting(
                    img.caption || json.title,
                    {}
                );
                sectionContent.push(`# [${caption} | ${imgPath}]`);
            }
        });

        content.push(sectionContent.join('\n'));
    });

    return summary + content.join('\n\n');
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default convertWikiToMD;