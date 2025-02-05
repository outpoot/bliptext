import { WORD_MATCH_REGEX } from '$lib/shared/wordMatching';

type WordEventHandlers = {
    onHover?: (element: HTMLElement) => void;
    onLeave?: (element: HTMLElement) => void;
    onClick?: (element: HTMLElement) => void;
};

export class WordProcessor {
    public wordIndicesMap = new Map<HTMLElement, number>();
    private eventHandlers: WordEventHandlers;
    private cleanedWordToIndices: Map<string, number[]>;
    private wordPositions: Map<number, number>;
    private usedIndices: Set<number>;

    constructor(
        private content: string,
        eventHandlers: WordEventHandlers = {}
    ) {
        this.eventHandlers = eventHandlers;
        this.cleanedWordToIndices = new Map();
        this.wordPositions = new Map();
        this.usedIndices = new Set();

        const contentWords = this.content.match(WORD_MATCH_REGEX) || [];
        let position = 0;

        contentWords.forEach((word, index) => {
            position = this.content.indexOf(word, position);
            const cleaned = this.cleanContentWord(word);
            this.cleanedWordToIndices.set(cleaned, [...(this.cleanedWordToIndices.get(cleaned) || []), index]);
            this.wordPositions.set(index, position);
            position += word.length;
        });
    }

    private cleanContentWord(word: string): string {
        if (word.startsWith('**') && word.endsWith('**')) return word.slice(2, -2);
        if (word.startsWith('*') && word.endsWith('*')) return word.slice(1, -1);
        if (word.startsWith('[')) {
            const closingBracket = word.indexOf(']');
            return closingBracket !== -1 ? word.substring(1, closingBracket).trim() : word;
        }
        return word.replace(/[*_.,]/g, '');
    }

    isValidFormattedWord(word: string): boolean {
        return [/^\*\*[^*]+\*\*$/, /^\*[^*]+\*$/, /^\[[\w\s]+\]\([^\s]{1,50}\)$/, /^\w+$/]
            .some(pattern => pattern.test(word));
    }

    private attachEventListeners(element: HTMLElement) {
        const { onHover, onLeave, onClick } = this.eventHandlers;
        onHover && element.addEventListener('mouseenter', () => onHover(element));
        onLeave && element.addEventListener('mouseleave', () => onLeave(element));
        onClick && element.addEventListener('click', () => onClick(element));
    }

    private createWrapperElement(tagName: 'strong' | 'em' | 'a', span: HTMLElement, url?: string): HTMLElement {
        const wrapper = document.createElement(tagName);
        if (tagName === 'a' && url) {
            wrapper.setAttribute('href', url);
            wrapper.setAttribute('rel', 'noopener noreferrer');
            wrapper.setAttribute('target', '_blank');
        }
        wrapper.appendChild(span);
        return wrapper;
    }

    private createBaseSpan(text: string): HTMLElement {
        const span = document.createElement('span');
        span.className = 'hv';
        span.textContent = text;
        return span;
    }

    private determineWordElement(word: string, baseSpan: HTMLElement): HTMLElement {
        if (word.startsWith('**') && word.endsWith('**')) {
            return this.createWrapperElement('strong', baseSpan);
        }
        if (word.startsWith('*') && word.endsWith('*')) {
            return this.createWrapperElement('em', baseSpan);
        }
        if (word.startsWith('[')) {
            const match = word.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (match && (match[2].startsWith('http://') || match[2].startsWith('https://'))) {
                return this.createWrapperElement('a', baseSpan, match[2]);
            }
        }
        return baseSpan;
    }

    public getWordsFromText(text: string): string[] {
        const textWithoutTags = text.replace(/:::summary[\s\S]*?:::/g, '')
            .replace(/^#.*$/gm, '');
        const matched = textWithoutTags.match(WORD_MATCH_REGEX) || [];
        console.log('Client extracted words:', matched);
        return matched;
    }

    replaceWord(
        newWord: string,
        element: HTMLElement,
        onWordChange: (data: { newWord: string; wordIndex: number; context?: string }) => void
    ) {
        if (!this.isValidFormattedWord(newWord)) return console.error('Invalid word format');

        const actualIndex = this.wordIndicesMap.get(element);
        if (actualIndex === undefined) return;

        // Get surrounding context with raw text
        const words = this.getWordsFromText(this.content);
        const start = Math.max(0, actualIndex - 2);
        const end = Math.min(words.length, actualIndex + 3);

        const context = {
            before: words.slice(start, actualIndex).join(' '),
            word: words[actualIndex],
            after: words.slice(actualIndex + 1, end).join(' '),
            index: actualIndex
        };

        element = element.closest('a, strong, em') || element;
        element.classList.add('word-exit');

        setTimeout(() => {
            const baseSpan = this.createBaseSpan(this.cleanContentWord(newWord));
            const replacement = this.determineWordElement(newWord, baseSpan);

            // Ensure we maintain the exact position mapping
            baseSpan.dataset.wordIndex = actualIndex.toString();
            baseSpan.dataset.position = element.dataset.position;
            this.wordIndicesMap.set(baseSpan, actualIndex);
            this.wordIndicesMap.delete(element);
            this.attachEventListeners(baseSpan);

            element.replaceWith(replacement);
            baseSpan.classList.add('word-enter');
            setTimeout(() => baseSpan.classList.remove('word-enter'), 500);
        }, 300);

        onWordChange?.({ newWord, wordIndex: actualIndex, context: JSON.stringify(context) });
    }

    private createWordSpan(word: string): HTMLElement {
        const baseSpan = this.createBaseSpan(this.cleanContentWord(word));
        const element = this.determineWordElement(word, baseSpan);

        const cleanedWord = this.cleanContentWord(word);
        const possibleIndices = this.cleanedWordToIndices.get(cleanedWord) || [];
        const actualIndex = possibleIndices.find(index => !this.usedIndices.has(index)) ?? -1;

        if (actualIndex !== -1) {
            this.usedIndices.add(actualIndex);
            this.wordIndicesMap.set(baseSpan, actualIndex);
            baseSpan.dataset.wordIndex = actualIndex.toString();
            const position = this.wordPositions.get(actualIndex);
            if (position !== undefined) {
                baseSpan.dataset.position = position.toString();
            }
        }

        this.attachEventListeners(baseSpan);
        return element;
    }

    wrapTextNodes(element: Element) {
        const nodes: Text[] = [];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
            acceptNode: node => (
                node.textContent?.trim() && !node.parentElement?.classList.contains('hv')
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT
            )
        });

        while (walker.nextNode()) nodes.push(walker.currentNode as Text);
        nodes.forEach(textNode => {
            const parent = textNode.parentElement;
            const text = textNode.textContent || '';

            if (parent?.matches('strong, em, a')) {
                const formatted = parent instanceof HTMLAnchorElement
                    ? `[${text}](${parent.href})`
                    : parent.tagName === 'STRONG' ? `**${text}**` : `*${text}*`;
                parent.replaceWith(this.createWordSpan(formatted));
                return;
            }

            const fragment = document.createDocumentFragment();
            const words = this.getWordsFromText(text);
            let lastIndex = 0;

            words.forEach(match => {
                const preSpace = text.slice(lastIndex, text.indexOf(match, lastIndex));
                if (preSpace) fragment.appendChild(document.createTextNode(preSpace));
                fragment.appendChild(this.createWordSpan(match));
                lastIndex = text.indexOf(match, lastIndex) + match.length;
            });

            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
            }

            textNode.replaceWith(fragment);
        });
    }

    getElementByWordIndex(index: number): HTMLElement | null {
        return Array.from(this.wordIndicesMap.entries())
            .find(([, wordIndex]) => wordIndex === index)?.[0] || null;
    }
}