import { env } from '$env/dynamic/private';

function stringToColor(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const color = Math.abs(hash) % 0xFFFFFF;
    return color < 0x222222 ? color + 0x222222 : color;
}

interface WebhookData {
    oldWord: string;
    newWord: string;
    articleTitle: string;
    articleSlug: string;
    editorName: string;
    editorId: string;
}

export async function sendDiscordWebhook(data: WebhookData) {
    if (!env.DISCORD_WEBHOOK_URL) return;

    const color = stringToColor(data.editorName);
    const inspectUrl = `${env.SITE_URL}/admin/inspect?userId=${data.editorId}`;
    const articleUrl = `${env.SITE_URL}/articles/${data.articleSlug}`;

    try {
        await fetch(env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: 'Inspect user\'s changes',
                    description: `In article [${data.articleTitle}](${articleUrl})`,
                    fields: [
                        {
                            name: 'Old',
                            value: `\`${data.oldWord}\``,
                            inline: true
                        },
                        {
                            name: 'New',
                            value: `\`${data.newWord}\``,
                            inline: true
                        }
                    ],
                    color,
                    author: {
                        name: data.editorName
                    },
                    footer: {
                        text: 'Word has been updated'
                    },
                    url: inspectUrl
                }]
            })
        });
    } catch (error) {
        console.error('Failed to send Discord webhook:', error);
    }
}
