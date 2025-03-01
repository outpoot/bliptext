export const WORD_MATCH_REGEX = /\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]\*]+\]\([^\)]+\)|[^\s]+[.,_]?/g;
const INVISIBLE_CHARS_REGEX = /[\u00A0\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u2000-\u200F\u202F\u205F\u2060\u2061-\u2064\u206A-\u206F\u2800\u3164\uFEFF\uFFA0]/;
export const MAX_WORD_LENGTH = 100;

// warning - this function is not secure and should not be used for moderation
export function isValidWord(newWord: string): boolean {
    if (newWord.length > MAX_WORD_LENGTH) return false;
    if (INVISIBLE_CHARS_REGEX.test(newWord)) return false;

    if (/[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(newWord)) {
        return false;
    }

    const isBold = /^\*\*[\p{L}\p{N}](?:[\p{L}\p{N}_-]*[\p{L}\p{N}])?\*\*$/u.test(newWord);
    const isItalic = /^\*[\p{L}\p{N}](?:[\p{L}\p{N}_-]*[\p{L}\p{N}])?\*$/u.test(newWord);
    const isPlainWord = /^[\p{L}\p{N}](?:[\p{L}\p{N}_-]*[\p{L}\p{N}])?[.,]?$/u.test(newWord);
    const isLink = /^\[[\p{L}\p{N}](?:[\p{L}\p{N}_-]*[\p{L}\p{N}])?\]\((https?:\/\/[^"'<>)\s]{1,100})\)$/u.test(newWord);

    return isBold || isItalic || isPlainWord || isLink;
}
