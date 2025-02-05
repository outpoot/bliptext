import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cubicOut } from "svelte/easing";
import type { TransitionConfig } from "svelte/transition";
import { WORD_MATCH_REGEX } from '$lib/shared/wordMatching';

type FlyAndScaleParams = {
	y?: number;
	x?: number;
	start?: number;
	duration?: number;
};

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

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

	for (const char of queryLower) {
		const index = textLower.indexOf(char, lastIndex + 1);
		if (index === -1) return 0;

		score += 1 + (
			lastIndex === index - 1 ? 2 :
				textLower[index - 1] === ' ' ? 1.5 :
					0
		);

		lastIndex = index;
	}

	if (textLower.startsWith(queryLower)) {
		score *= 2;
	}

	return score;
}
// parsing
export function getWordAtIndex(content: string, index: number): string | null {
	const words = content.match(WORD_MATCH_REGEX);
	if (!words || index < 0 || index >= words.length) return null;
	return words[index];
}

export function replaceWordAtIndex(content: string, index: number, newWord: string): string {
	const processedContent = content.replace(/:::summary[\s\S]*?:::/g, '');
	const words = processedContent.match(WORD_MATCH_REGEX);

	if (!words || index < 0 || index >= words.length) {
		return content;
	}

	// Convert special regex characters to literals for string search
	function escapeRegExp(string: string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	// Find exact position of a word, considering previous words' positions
	function findWordPosition(text: string, words: string[], targetIndex: number): number {
		let pos = 0;
		for (let i = 0; i <= targetIndex; i++) {
			const word = words[i];
			const escapedWord = escapeRegExp(word);
			const regex = new RegExp(escapedWord, 'g');
			regex.lastIndex = pos;
			const match = regex.exec(text);
			if (!match) return -1;
			if (i === targetIndex) {
				return match.index;
			}
			pos = match.index + word.length;
		}
		return -1;
	}

	const targetPos = findWordPosition(processedContent, words, index);
	if (targetPos === -1) return content;

	// Map position back to original content
	const summaryEndMatch = content.match(/:::summary[\s\S]*?:::/);
	const offset = summaryEndMatch ? summaryEndMatch.index! + summaryEndMatch[0].length : 0;
	const targetWord = words[index];
	const targetPosInOriginal = findWordPosition(content.slice(offset), words, index);

	if (targetPosInOriginal === -1) return content;

	const finalPos = offset + targetPosInOriginal;
	return content.slice(0, finalPos) +
		newWord +
		content.slice(finalPos + targetWord.length);
}
