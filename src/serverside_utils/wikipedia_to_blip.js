const fs = require('fs');
const wtf = require('wtf_wikipedia');
const crypto = require('crypto');

function cleanText(text) {
    return String(text)
        .replace(/\{\{.*?\}\}/g, '') // Remove templates
        .replace(/\[\[([^|\]]+\|)?([^\]]+)\]\]/g, '$2') // Simplify links
        .replace(/'''?/g, '') // Remove bold/italic markup
        .replace(/<\/?br\/?>/gi, '  ') // Handle line breaks
        .replace(/\n+/g, '\n') // Collapse newlines
        .trim();
}

function buildImagePath(img) {
    const originalFilename = img.file().replace(/^File:/, '');

    // Only allow specific image extensions
    const allowedExtensions = /\.(jpg|jpeg|png)$/i;
    if (!allowedExtensions.test(originalFilename)) {
        return null;
    }

    const hash = crypto.createHash('md5').update(originalFilename).digest('hex');
    const dir1 = hash[0];
    const dir2 = hash.slice(0, 2);

    // Wikimedia filename formatting with special character encoding
    const safeFilename = encodeURIComponent(originalFilename)
        .replace(/%20/g, '_')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/_/g, '///')  // Replace underscores with a unique marker
    return `upload.wikimedia.org/wikipedia/commons/thumb/${dir1}/${dir2}/${safeFilename}/330px-${safeFilename}`;
}

function convertWikiToMD(inputPath, outputPath) {
    const wikiText = fs.readFileSync(inputPath, 'utf8');
    const doc = wtf(wikiText);

    let summary = ':::summary\n';
    const infobox = doc.infobox()?.json();

    // Handle main image
    if (infobox?.image) {
        const img = doc.image(infobox.image);
        if (img) {
            const imgPath = buildImagePath(img);
            if (imgPath) { // Only add image if path was generated (valid extension)
                summary += `![${img.caption()}](${imgPath})\n`;
            }
        }
    }

    // Process infobox key-value pairs
    if (infobox) {
        Object.entries(infobox).forEach(([key, value]) => {
            if (key === 'image') return;

            const cleanKey = key.replace(/_/g, ' ')
                .replace(/(^|\s)\S/g, t => t.toUpperCase());

            const cleanedValue = cleanText(value?.text || value);

            if (cleanKey && cleanedValue) {
                summary += `**${cleanKey}:** ${cleanedValue}  \n`;
            }
        });
    }
    summary += ':::\n\n';

    // Process sections with images
    let content = doc.sections().map(section => {
        let sectionContent = `## ${section.title()}\n${cleanText(section.text())}`;

        const images = section.images()
            .map(img => {
                const imgPath = buildImagePath(img);
                return imgPath ? `# [${img.caption() || img.file().replace(/^File:/, '')} | ${imgPath}]` : null;
            })
            .filter(Boolean) // Remove null entries
            .join('\n');

        if (images) {
            sectionContent += `\n\n${images}`;
        }

        return sectionContent;
    }).join('\n\n');

    fs.writeFileSync(outputPath, summary + content);
}

convertWikiToMD('input.txt', 'output.md');