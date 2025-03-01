export const WORD_MATCH_REGEX = /\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]\*]+\]\([^\)]+\)|[^\s]+[.,_]?/g;
const INVISIBLE_CHARS_REGEX = /[\u3164\u200B\u200C\u200D\uFEFF\u2060]/;
export const MAX_WORD_LENGTH = 50;

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
