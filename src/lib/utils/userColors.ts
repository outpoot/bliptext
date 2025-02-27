const COLORS = [
    '#fecaca', // red
    '#fed7aa', // orange
    '#fef08a', // yellow
    '#bbf7d0', // green
    '#bae6fd', // blue
    '#ddd6fe', // purple
    '#fbcfe8', // pink
];

const colorCache = new Map<string, string>();

export function getUserColor(username: string): string {
    if (colorCache.has(username)) {
        return colorCache.get(username)!;
    }

    let hash = 0;
    const len = Math.min(username.length, 8);
    for (let i = 0; i < len; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % COLORS.length;
    const color = COLORS[index];

    colorCache.set(username, color);
    
    return color;
}