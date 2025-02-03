type WordEventHandlers = {
    onHover?: (element: HTMLElement) => void;
    onLeave?: (element: HTMLElement) => void;
    onClick?: (element: HTMLElement) => void;
};

export class WordProcessor {
    public wordIndicesMap = new Map<HTMLElement, number>();
    private eventHandlers: WordEventHandlers;
    private cleanedWordToIndices: Map<string, number[]>;
    private usedIndices: Set<number>;

    constructor(
        private content: string,
        eventHandlers: WordEventHandlers = {}
    ) {
        this.eventHandlers = eventHandlers;
        this.cleanedWordToIndices = new Map();
        this.usedIndices = new Set();

        const contentWords = this.content.match(/\[.+?\]\([^)]+\)|[^\s]+/g) || [];

        contentWords.forEach((word, index) => {
            const cleaned = this.cleanContentWord(word);
            if (!this.cleanedWordToIndices.has(cleaned)) {
                this.cleanedWordToIndices.set(cleaned, []);
            }
            this.cleanedWordToIndices.get(cleaned)?.push(index);
        });
    }

    private cleanContentWord(word: string): string {
        let cleaned = word.replace(/[*_.,]/g, '');
        if (cleaned.startsWith('[')) {
            const closingBracket = cleaned.indexOf(']');
            if (closingBracket !== -1) {
                cleaned = cleaned.substring(1, closingBracket).trim();
            }
        }
        return cleaned;
    }

    isValidFormattedWord(word: string): boolean {
        // bold/italic
        if (/^\*\*\w+\*\*$/.test(word) || /^\*\w+\*$/.test(word)) {
            return true;
        }
        // hyperlink with multi-word text and url up to 50 chars
        if (/^\[[\w\s]+\]\([^\s]{1,50}\)$/.test(word)) {
            return true;
        }
        // unformatted word
        return /^\w+$/.test(word);
    }

    private attachEventListeners(element: HTMLElement) {
        if (this.eventHandlers.onHover) {
            element.addEventListener('mouseenter', () => this.eventHandlers.onHover?.(element));
        }
        if (this.eventHandlers.onLeave) {
            element.addEventListener('mouseleave', () => this.eventHandlers.onLeave?.(element));
        }
        if (this.eventHandlers.onClick) {
            element.addEventListener('click', () => this.eventHandlers.onClick?.(element));
        }
    }

    replaceWord(
        newWord: string,
        element: HTMLElement,
        onWordChange: (data: { newWord: string; wordIndex: number }) => void
    ) {
        if (!this.isValidFormattedWord(newWord)) {
            console.error('Invalid word format');
            return;
        }

        const actualIndex = this.wordIndicesMap.get(element);
        if (actualIndex === undefined) return;

        element = element.closest('a, strong, em') || element;
        element.classList.add('word-exit');

        setTimeout(() => {
            const span = document.createElement('span');
            span.className = 'hv';
            span.dataset.wordIndex = actualIndex.toString();
            span.textContent = newWord.startsWith('**')
                ? newWord.slice(2, -2)
                : newWord.startsWith('*')
                    ? newWord.slice(1, -1)
                    : newWord.startsWith('[')
                        ? newWord.match(/^\[(.+?)\]/)?.[1] || newWord
                        : newWord;

            this.attachEventListeners(span);

            let replacement: Element = span;
            if (newWord.startsWith('[')) {
                const match = newWord.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                if (match) {
                    const [, linkText, url] = match;

                    if (url.startsWith('http://') || url.startsWith('https://')) {
                        const anchor = document.createElement('a');
                        anchor.href = url;
                        anchor.textContent = linkText;
                        anchor.rel = 'noopener noreferrer';
                        anchor.target = '_blank';
                        replacement = anchor;
                    } else {
                        replacement = span;
                        span.textContent = linkText;
                    }
                }
            } else if (newWord.startsWith('**')) {
                const strong = document.createElement('strong');
                strong.appendChild(span);
                replacement = strong;
            } else if (newWord.startsWith('*')) {
                const em = document.createElement('em');
                em.appendChild(span);
                replacement = em;
            }

            this.wordIndicesMap.set(span, actualIndex);
            this.wordIndicesMap.delete(element);

            element.replaceWith(replacement);
            span.classList.add('word-enter');
            setTimeout(() => span.classList.remove('word-enter'), 500);
        }, 300);

        onWordChange?.({ newWord, wordIndex: actualIndex });
    }

    private createWordSpan(word: string): HTMLSpanElement {
        const span = document.createElement('span');
        span.textContent = word;
        span.className = 'hv';

        const cleanedWord = this.cleanContentWord(word);
        const possibleIndices = this.cleanedWordToIndices.get(cleanedWord) || [];
        let actualIndex = -1;

        for (const index of possibleIndices) {
            if (!this.usedIndices.has(index)) {
                actualIndex = index;
                this.usedIndices.add(index);
                break;
            }
        }

        if (actualIndex !== -1) {
            this.wordIndicesMap.set(span, actualIndex);
            span.dataset.wordIndex = actualIndex.toString();
        }

        this.attachEventListeners(span);
        return span;
    }

    wrapTextNodes(element: Element) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => {
                if (!node.textContent?.trim() || node.parentElement?.classList.contains('hv')) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        const nodes: Text[] = [];
        let node;
        while ((node = walker.nextNode())) nodes.push(node as Text);

        nodes.reverse().forEach((textNode) => {
            const isInLink = textNode.parentElement?.tagName === 'A';
            if (isInLink) {
                const span = this.createWordSpan(textNode.textContent || '');
                textNode.parentNode?.replaceChild(span, textNode);
            } else {
                const words = textNode.textContent?.split(/\s+/) ?? [];
                const fragment = document.createDocumentFragment();

                words.forEach((word) => {
                    if (!word.trim()) return;
                    const span = this.createWordSpan(word);
                    fragment.appendChild(span);
                    fragment.appendChild(document.createTextNode(' '));
                });

                textNode.parentNode?.replaceChild(fragment, textNode);
            }
        });
    }

    getElementByWordIndex(index: number): HTMLElement | null {
        for (const [element, wordIndex] of this.wordIndicesMap.entries()) {
            if (wordIndex === index) return element;
        }
        return null;
    }
}
