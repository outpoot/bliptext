import latinize from "latinize";
import stringComparison from 'string-comparison'

export const words: Array<string> = [
    "nigga",
    "nigger",
    "faggot",
    "retard",
    "ching chong",
];

export function cleanUp(msg: string): string[] {
    msg = latinize(msg);
    msg = msg.trim().toLowerCase().normalize("NFKD");
    const inputs = msg.split(/\s/g);
    return inputs;
}

export function checkHardcore(msg: string): boolean {
    const inputs = cleanUp(msg);
    for (const input of inputs) {
        for (const word of words) {
            if (input === word || input.includes(word)) {
                return true;
            } else if (stringComparison.cosine.similarity(input, word) > 0.80) {
                return true
            }
        }
    }
    return false;
}