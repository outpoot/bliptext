import { isValidWord } from "./wordMatching";

describe("isValidWord", () => {
  describe("Plain words", () => {
    test('Simple word "hello" returns true', () => {
      expect(isValidWord("hello")).toBe(true);
    });

    test('Simple word "world" returns true', () => {
      expect(isValidWord("world")).toBe(true);
    });

    test('Word with numbers "test123" returns true', () => {
      expect(isValidWord("test123")).toBe(true);
    });

    test('Word with underscore "lorem_ipsum" returns true', () => {
      expect(isValidWord("lorem_ipsum")).toBe(true);
    });

    test('Word with hyphen "hello-world" returns true', () => {
      expect(isValidWord("hello-world")).toBe(true);
    });

    test('Word with both hyphen and underscore "hello_world-test" returns true', () => {
      expect(isValidWord("hello_world-test")).toBe(true);
    });

    test('Word ending with a comma "hello," returns true', () => {
      expect(isValidWord("hello,")).toBe(true);
    });

    test('Word ending with a period "lorem." returns true', () => {
      expect(isValidWord("lorem.")).toBe(true);
    });

    test("Word with Unicode letters 'café' returns true", () => {
      expect(isValidWord("café")).toBe(true);
    });

    test("Word with Unicode letters 'niño' returns true", () => {
      expect(isValidWord("niño")).toBe(true);
    });

    test('Word containing invalid punctuation "hello!" returns false', () => {
      expect(isValidWord("hello!")).toBe(false);
    });

    test('Word with interior space "hello world" returns false', () => {
      expect(isValidWord("hello world")).toBe(false);
    });

    test('Word starting with punctuation ",hello" returns false', () => {
      expect(isValidWord(",hello")).toBe(false);
    });

    test('Word starting with punctuation ".ipsum" returns false', () => {
      expect(isValidWord(".ipsum")).toBe(false);
    });

    test('Word ending with underscore "test_" returns false', () => {
      expect(isValidWord("test_")).toBe(false);
    });

    test('Word ending with hyphen "hello-" returns false', () => {
      expect(isValidWord("hello-")).toBe(false);
    });
  });

  describe("Bold words", () => {
    test('Valid bold word "**hello**" returns true', () => {
      expect(isValidWord("**hello**")).toBe(true);
    });

    test('Valid bold word with hyphen "**hello-world**" returns true', () => {
      expect(isValidWord("**hello-world**")).toBe(true);
    });

    test('Valid bold word with underscore "**hello_world**" returns true', () => {
      expect(isValidWord("**hello_world**")).toBe(true);
    });

    test('Bold word that improperly includes punctuation "**hello,**" returns false', () => {
      expect(isValidWord("**hello,**")).toBe(false);
    });

    test("Bold word missing closing markers '**hello*' returns false", () => {
      expect(isValidWord("**hello*")).toBe(false);
    });

    test("A plain word 'hello' returns true (not as a bold word)", () => {
      expect(isValidWord("hello")).toBe(true);
    });
  });

  describe("Italic words", () => {
    test('Valid italic word "*hello*" returns true', () => {
      expect(isValidWord("*hello*")).toBe(true);
    });

    test('Valid italic word with hyphen "*hello-world*" returns true', () => {
      expect(isValidWord("*hello-world*")).toBe(true);
    });

    test('Valid italic word with underscore "*hello_world*" returns true', () => {
      expect(isValidWord("*hello_world*")).toBe(true);
    });

    test('Italic word that improperly includes punctuation "*hello,*" returns false', () => {
      expect(isValidWord("*hello,*")).toBe(false);
    });

    test("Italic word missing ending marker '*hello**' returns false", () => {
      expect(isValidWord("*hello**")).toBe(false);
    });
  });

  describe("Boundary conditions and edge cases", () => {
    test("Empty string returns false", () => {
      expect(isValidWord("")).toBe(false);
    });

    test("Single letter plain word 'a' returns true", () => {
      expect(isValidWord("a")).toBe(true);
    });

    test("Single letter with punctuation 'a.' returns true", () => {
      expect(isValidWord("a.")).toBe(true);
    });

    test("Single letter bold '**a**' returns true", () => {
      expect(isValidWord("**a**")).toBe(true);
    });

    test("Single letter italic '*a*' returns true", () => {
      expect(isValidWord("*a*")).toBe(true);
    });

    test("String of length 101 returns false", () => {
      const validPortion = "a".repeat(100);
      const tooLong = validPortion + "a";
      expect(tooLong.length).toBe(101);
      expect(isValidWord(tooLong)).toBe(false);
    });

    test("String of length 100 (valid plain word) returns true", () => {
      // Build a 100-character valid plain word.
      let base = "ab".repeat(49); // 98 characters
      const word100 = "a" + base + "b"; // 1 + 98 + 1 = 100 characters
      expect(word100.length).toBe(100);
      expect(isValidWord(word100)).toBe(true);
    });
  });

  describe("Additional invalid words", () => {
    // Additional invalid plain words
    test('Plain word with extra exclamation "hello!!" returns false', () => {
      expect(isValidWord("hello!!")).toBe(false);
    });

    test('Plain word with double punctuation "hello,." returns false', () => {
      expect(isValidWord("hello,.")).toBe(false);
    });

    test('Plain word with leading space " hello" returns false', () => {
      expect(isValidWord(" hello")).toBe(false);
    });

    test('Plain word with trailing space "hello " returns false', () => {
      expect(isValidWord("hello ")).toBe(false);
    });

    test('Plain word with illegal character "abc@def" returns false', () => {
      expect(isValidWord("abc@def")).toBe(false);
    });

    test('Plain word with illegal character "test#1" returns false', () => {
      expect(isValidWord("test#1")).toBe(false);
    });

    test('Plain word with double punctuation at end "hello.." returns false', () => {
      expect(isValidWord("hello..")).toBe(false);
    });

    // Additional invalid bold words
    test('Bold word with extra markers "***hello***" returns false', () => {
      expect(isValidWord("***hello***")).toBe(false);
    });

    test('Bold word with text outside markers "**hello**world" returns false', () => {
      expect(isValidWord("**hello**world")).toBe(false);
    });

    // Additional invalid italic words
    test('Italic word with text outside markers "*hello*world" returns false', () => {
      expect(isValidWord("*hello*world")).toBe(false);
    });

    test('Italic word with extra markers "**hello*" returns false', () => {
      expect(isValidWord("**hello*")).toBe(false);
    });

    test('Italic word with a leading space inside marker "* hello*" returns false', () => {
      expect(isValidWord("* hello*")).toBe(false);
    });
  });

  describe("Hyperlinks", () => {
    test('Valid hyperlink "[Google](https://google.com)" returns true', () => {
      expect(isValidWord("[Google](https://google.com)")).toBe(true);
    });

    test('Valid hyperlink with minimal URL "[Test](x)" returns true', () => {
      expect(isValidWord("[Test](x)")).toBe(true);
    });

    test('Invalid hyperlink missing closing parenthesis "[Google](https://google.com" returns false', () => {
      expect(isValidWord("[Google](https://google.com")).toBe(false);
    });

    test('Invalid hyperlink with space in URL "[Google](https:// google.com)" returns false', () => {
      expect(isValidWord("[Google](https:// google.com)")).toBe(false);
    });

    test('Invalid hyperlink with nested brackets "[G[oogle]](https://google.com)" returns false', () => {
      expect(isValidWord("[G[oogle]](https://google.com)")).toBe(false);
    });

    test('Invalid hyperlink with extra markers "**[Google](https://google.com)**" returns false', () => {
      expect(isValidWord("**[Google](https://google.com)**")).toBe(false);
    });
  });
});