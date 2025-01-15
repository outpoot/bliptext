export class WordProcessor {
    wordIndicesMap = new Map<HTMLElement, number>();

    constructor(private content: string) { }

    isValidFormattedWord(word: string): boolean {
        // bold/italic
        if (/^\*\*\w+\*\*$/.test(word) || /^\*\w+\*$/.test(word)) {
            return true;
        }
        // hyperlink with url up to 50 chars
        if (/^\[\w+\]\([^\s]{1,50}\)$/.test(word)) {
            return true;
        }
        // unformatted word
        return /^\w+$/.test(word);
    }

    replaceWord(oldWord: string, newWord: string, element: HTMLElement, onWordChange: (data: { oldWord: string; newWord: string }) => void) {
        if (!this.isValidFormattedWord(newWord)) {
            console.error('Invalid word format');
            return;
        }

        element.classList.remove('selected', 'shake');
        element.classList.add('word-exit');

        setTimeout(() => {
            element.textContent = newWord;
            element.classList.remove('word-exit');
            element.classList.add('word-enter');
            setTimeout(() => element.classList.remove('word-enter'), 500);

            const [, text, url] = newWord.match(/^\[(.+)\]\((.+)\)$/) || [];
            const span = document.createElement('span');
            span.className = 'hv word-enter';

            if (newWord.startsWith('[')) {
                const anchor = document.createElement('a');
                span.textContent = text;
                anchor.href = url;
                anchor.appendChild(span);
                element.replaceWith(anchor);
            } else if (newWord.startsWith('**')) {
                span.textContent = newWord.slice(2, -2);
                const strong = document.createElement('strong');
                strong.appendChild(span);
                element.replaceWith(strong);
            } else if (newWord.startsWith('*')) {
                span.textContent = newWord.slice(1, -1);
                const em = document.createElement('em');
                em.appendChild(span);
                element.replaceWith(em);
            } else {
                span.textContent = newWord;
                element.replaceWith(span);
            }
        }, 300);

        onWordChange?.({ oldWord, newWord });
    }

    createWordSpan(word: string, contentWords: string[], handleElementHover: (element: HTMLElement) => void, handleElementLeave: (element: HTMLElement) => void, handleElementClick: (element: HTMLElement) => void): HTMLSpanElement {
        const span = document.createElement('span');
        span.textContent = word;
        span.className = 'hv';

        const actualIndex = contentWords.findIndex((w: string, idx: number) => {
            if (Array.from(this.wordIndicesMap.values()).includes(idx)) return false;

            // Remove markdown syntax for comparison
            const cleanWord = word.replace(/[*_.,]/g, '');
            const cleanW = w.replace(/[*_.,]/g, '');

            if (cleanW.startsWith('[')) {
                const closingBracket = cleanW.indexOf(']');
                return closingBracket !== -1 ? cleanW.substring(1, closingBracket) === cleanWord : false;
            }
            return cleanW === cleanWord;
        });

        if (actualIndex !== -1) {
            this.wordIndicesMap.set(span, actualIndex);
        }

        span.addEventListener('mouseenter', () => handleElementHover(span));
        span.addEventListener('mouseleave', () => handleElementLeave(span));
        span.addEventListener('click', () => handleElementClick(span));

        return span;
    }

    wrapTextNodes(element: Element, handleElementHover: (element: HTMLElement) => void, handleElementLeave: (element: HTMLElement) => void, handleElementClick: (element: HTMLElement) => void) {
        const contentWords = this.content.split(/\s+/);
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
                const span = this.createWordSpan(textNode.textContent || '', contentWords, handleElementHover, handleElementLeave, handleElementClick);
                textNode.parentNode?.replaceChild(span, textNode);
            } else {
                const words = textNode.textContent?.split(/\s+/) ?? [];
                const fragment = document.createDocumentFragment();

                words.forEach((word) => {
                    if (!word.trim()) return;
                    const span = this.createWordSpan(word, contentWords, handleElementHover, handleElementLeave, handleElementClick);
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
