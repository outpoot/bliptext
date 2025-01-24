import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import fetch from 'node-fetch';
import convertWikiToMD from './wikipedia_to_blip';

async function processJsonl(inputPath, sessionToken) {
    const fileStream = createReadStream(inputPath);
    const rl = createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let count = 0;
    const maxArticles = Infinity;

    for await (const line of rl) {
        if (count >= maxArticles) break;

        try {
            const article = JSON.parse(line);

            const content = await convertWikiToMD(article.raw_text);

            const response = await fetch("http://localhost:3000/api/articles", {
                method: 'POST',
                headers: {
                    "accept": "*/*",
                    "content-type": "text/plain;charset=UTF-8",
                    "cookie": `better-auth.session_token=${sessionToken}`,
                    "Referer": "http://localhost:3000/admin/new",
                    "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\", \"Google Chrome\";v=\"132\"",
                    "sec-ch-ua-mobile": "?0",
                    "sec-ch-ua-platform": "\"Windows\"",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin"
                },
                body: JSON.stringify({
                    title: article.title,
                    content: content
                })
            });

            if (!response.ok) {
                console.error(`Failed to post ${article.title}: ${response.status} ${response.statusText} ${await response.text()}`);
                continue;
            }

            console.log(`Posted: ${article.title} count: ${count}`);
            count++;
        } catch (error) {
            console.error(`Error processing article: ${error.message}`);
        }
    }

    console.log(`Finished processing ${count} articles`);
}


// Command-line execution
const [, , inputPath, sessionToken] = process.argv;
if (!inputPath || !sessionToken) {
    console.log('Usage: node importer.js <input.jsonl> <session_token>');
    process.exit(1);
}

processJsonl(inputPath, sessionToken).catch(console.error);