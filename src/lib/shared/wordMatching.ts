export const WORD_MATCH_REGEX = /\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]\*]+\]\([^\)]+\)|[^\s]+/g;

export function isValidWord(newWord: string): boolean {
    if (newWord.length > 100) return false;

    const isBold = /^\*\*[\p{L}\p{N}](?:[\p{L}\p{N}_-]*[\p{L}\p{N}])?\*\*$/u.test(
        newWord
    );

    const isItalic = /^\*[\p{L}\p{N}](?:[\p{L}\p{N}_-]*[\p{L}\p{N}])?\*$/u.test(
        newWord
    );

    const isBoldOrItalic = isBold || isItalic;

    const isPlainWord = /^[\p{L}\p{N}](?:[\p{L}\p{N}_-]*[\p{L}\p{N}])?[.,]?$/u.test(
        newWord
    );

    const isLink = /^\[[^\]\[\(\)]+\]\([^\s]{1,100}\)$/u.test(newWord);

    return isBoldOrItalic || isPlainWord || isLink;
}