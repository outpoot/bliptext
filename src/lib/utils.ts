import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
	y?: number;
	x?: number;
	start?: number;
	duration?: number;
};

export const flyAndScale = (
	node: Element,
	params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
	const style = getComputedStyle(node);
	const transform = style.transform === "none" ? "" : style.transform;

	const scaleConversion = (
		valueA: number,
		scaleA: [number, number],
		scaleB: [number, number]
	) => {
		const [minA, maxA] = scaleA;
		const [minB, maxB] = scaleB;

		const percentage = (valueA - minA) / (maxA - minA);
		const valueB = percentage * (maxB - minB) + minB;

		return valueB;
	};

	const styleToString = (
		style: Record<string, number | string | undefined>
	): string => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str;
			return str + `${key}:${style[key]};`;
		}, "");
	};

	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t
			});
		},
		easing: cubicOut
	};
};

export function getWordAtIndex(content: string, index: number): string {
    const words = content.split(/\s+/);
    return words[index] || '';
}

export function replaceWordAtIndex(content: string, index: number, newWord: string): string {
    const words = content.split(/\s+/);
    if (index >= 0 && index < words.length) {
        words[index] = newWord;
    }
    return words.join(' ');
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export function fuzzySearch(text: string, query: string): number {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    let score = 0;
    let lastIndex = -1;

    // Check each character in query
    for (const char of queryLower) {
        const index = textLower.indexOf(char, lastIndex + 1);
        if (index === -1) return 0;
        
        // Give higher score for consecutive matches and matches after spaces
        score += 1 + (
            lastIndex === index - 1 ? 2 : // Consecutive
            textLower[index - 1] === ' ' ? 1.5 : // After space
            0
        );
        
        lastIndex = index;
    }

    // Bonus for matching from the start
    if (textLower.startsWith(queryLower)) {
        score *= 2;
    }

    return score;
}