export const WORD_MATCH_REGEX = /\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|[^\s]+/g;

export function isValidWord(newWord: string): boolean {
    if (newWord.length > 100) return false;

    const isBoldOrItalic = (
        /^\*\*[^\s*][\s\w\d\p{P}]*[^\s*]\*\*$/u.test(newWord) ||
        /^\*[^\s*][\s\w\d\p{P}]*[^\s*]\*$/u.test(newWord)
    );

    const isLink = /^\[[\w\s\d\p{P}]+\]\([^\s]{1,100}\)$/u.test(newWord);
    const isPlainWord = /^(?!.*?_)[\w]+([.,])?$/.test(newWord);

    return isBoldOrItalic || isLink || isPlainWord;
}
// test suite
// console.log("Valid plain word:", isValidWord('hello'));
// console.log("Word with period:", isValidWord('hello.'));
// console.log("Word with comma:", isValidWord('hello,'));
// console.log("Word with underscore:", isValidWord('hello_world'));

// console.log("Valid bold text:", isValidWord('**bold**'));
// console.log("Invalid bold text missing end:", isValidWord('**bold'));
// console.log("Bold text with spaces:", isValidWord('**bold text**'));
// console.log("Bold text with punctuation:", isValidWord('**bold!**'));

// console.log("Valid italic text:", isValidWord('*italic*'));
// console.log("Invalid italic text missing end:", isValidWord('*italic'));
// console.log("Italic text with spaces:", isValidWord('*italic text*'));

// console.log("Valid link:", isValidWord('[text](http://example.com)'));
// console.log("Link with spaces in text:", isValidWord('[some text](http://example.com)'));
// console.log("Invalid link format:", isValidWord('[text(http://example.com)'));

// console.log("Word exceeding length limit:", isValidWord('a'.repeat(101)));
// console.log("Word at length limit:", isValidWord('a'.repeat(100)));

// console.log("Empty string:", isValidWord(''));
// console.log("Whitespace only:", isValidWord('   '));
// console.log("Special characters only:", isValidWord('###'));