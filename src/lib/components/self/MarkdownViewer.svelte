<script lang="ts">
	import type { Article } from '$lib/server/db/schema';
	import Markdown from 'svelte-exmarkdown';
	import { gfmPlugin } from 'svelte-exmarkdown/gfm';
	import type { Plugin } from 'svelte-exmarkdown';
	import rehypeHighlight from 'rehype-highlight';
	import 'highlight.js/styles/github-dark.css';

	// Components
	import WikiBox from '$lib/components/self/WikiBox.svelte';
	import Summary from '$lib/components/self/Summary.svelte';
	import TableOfContents from './TableOfContents.svelte';
	import Tools from './Tools.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import FileText from 'lucide-svelte/icons/file-text';
	import { Button } from '$lib/components/ui/button';

	let {
		content,
		title = '',
		showSidebars = true,
		showHeader = false,
		isEditPage = false,
		article = { title, content },
		onWordChange,
		selectedWord = ''
	} = $props<{
		content: string;
		title?: string;
		showSidebars?: boolean;
		showHeader?: boolean;
		isEditPage?: boolean;
		article?: Partial<Article>;
		selectedWord?: string;
		onWordChange: (data: { oldWord: string; newWord: string }) => void;
	}>();

	// Plugin configuration
	const plugins: Plugin[] = [
		gfmPlugin(),
		{ rehypePlugin: [rehypeHighlight, { ignoreMissing: true }] },
		{
			renderer: {
				h1: WikiBox,
				// @ts-ignore
				p: Summary
			}
		}
	];

	// State management
	let selectedElement: HTMLElement | null = $state(null);
	let showSubmitButton = $state(false);
	let submitButtonPosition = $state({ x: 0, y: 0 });
	let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
	const wordIndicesMap = new Map<HTMLElement, number>();

	// Word manipulation functions
	function replaceWord(oldWord: string, newWord: string, element: HTMLElement) {
		element.classList.remove('selected', 'shake');
		element.classList.add('word-exit');

		setTimeout(() => {
			element.textContent = newWord;
			element.classList.remove('word-exit');
			element.classList.add('word-enter');
			setTimeout(() => element.classList.remove('word-enter'), 500);
		}, 300);

		showSubmitButton = false;
		selectedElement = null;
		onWordChange?.({ oldWord, newWord });
	}

	async function handleHover(word: string, element: HTMLElement) {
		if (!selectedWord || !article?.slug) return;

		const actualIndex = wordIndicesMap.get(element);
		if (actualIndex === undefined) return;

		try {
			const response = await fetch(`/api/articles/${article.slug}/hover`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ wordIndex: actualIndex, newWord: selectedWord })
			});

			if (!response.ok) throw new Error('Hover update failed');

			const data = await response.json();
			console.log('Hover preview:', data);
		} catch (error) {
			console.error('Failed to send hover update:', error);
		}
	}

	// Event handlers
	function handleElementHover(element: HTMLElement, word: string) {
		if (!selectedWord) return;
		element.classList.add('shake');
		hoverTimeout = setTimeout(() => handleHover(word, element), 500);
	}

	function handleElementLeave(element: HTMLElement) {
		element.classList.remove('shake');
		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
			hoverTimeout = null;
		}
	}

	function handleElementClick(element: HTMLElement) {
		if (!selectedWord) return;
		if (selectedElement) selectedElement.classList.remove('selected');

		selectedElement = element;
		element.classList.add('selected');

		const rect = element.getBoundingClientRect();
		submitButtonPosition = { x: rect.left, y: rect.top - 40 };
		showSubmitButton = true;
	}

	// Text processing
	function createWordSpan(word: string, contentWords: string[]): HTMLSpanElement {
		const span = document.createElement('span');
		span.textContent = word;
		span.className = 'hv';

		const actualIndex = contentWords.findIndex((w: string, idx: number) => {
			if (Array.from(wordIndicesMap.values()).includes(idx)) return false;
			if (w.startsWith('[')) {
				const closingBracket = w.indexOf(']');
				return closingBracket !== -1 ? w.substring(1, closingBracket) === word : false;
			}
			return w === word;
		});

		if (actualIndex !== -1) {
			wordIndicesMap.set(span, actualIndex);
		}

		span.addEventListener('mouseenter', () => handleElementHover(span, word));
		span.addEventListener('mouseleave', () => handleElementLeave(span));
		span.addEventListener('click', () => handleElementClick(span));

		return span;
	}

	function wrapTextNodes(element: Element) {
		const contentWords = content.split(/\s+/);
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
				const span = createWordSpan(textNode.textContent || '', contentWords);
				textNode.parentNode?.replaceChild(span, textNode);
			} else {
				const words = textNode.textContent?.split(/\s+/) ?? [];
				const fragment = document.createDocumentFragment();

				words.forEach((word) => {
					if (!word.trim()) return;
					const span = createWordSpan(word, contentWords);
					fragment.appendChild(span);
					fragment.appendChild(document.createTextNode(' '));
				});

				textNode.parentNode?.replaceChild(fragment, textNode);
			}
		});
	}

	// Side effects
	$effect(() => {
		if (!isEditPage) return;

		const content = document.querySelector('.markdown-content');
		if (!content) return;

		wordIndicesMap.clear();

		content
			.querySelectorAll('a')
			.forEach((link) => link.addEventListener('click', (e) => e.preventDefault()));

		content.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, li').forEach(wrapTextNodes);
	});
</script>

<!-- Template -->
{#if showSidebars}
	<div class="flex gap-6">
		<div class="w-64 pt-16">
			<TableOfContents {content} {title} wordInput={false} />
		</div>

		<div class="flex-1">
			{#if showHeader}
				<div class="mb-4 flex items-baseline gap-2">
					<FileText class="h-5 w-5 text-muted-foreground" />
					<h1 id="title" class="text-3xl font-bold">{article.title || 'Untitled'}</h1>
				</div>
				<Separator class="mb-8" />
			{/if}
			<div class="markdown-content">
				<Markdown md={content} {plugins} />
			</div>
		</div>

		<div class="w-64 pt-16">
			<Tools {article} {isEditPage} />
		</div>
	</div>
{:else}
	<div class="flex-1">
		{#if showHeader}
			<div class="mb-4 flex items-baseline gap-2">
				<FileText class="h-5 w-5 text-muted-foreground" />
				<h1 id="title" class="text-3xl font-bold">{article?.title || 'Untitled'}</h1>
			</div>
			<Separator class="mb-8" />
		{/if}
		<div class="markdown-content">
			<Markdown md={content} {plugins} />
		</div>
	</div>
{/if}

{#if showSubmitButton && selectedElement}
	<Button
		class="fixed z-50"
		style="left: {submitButtonPosition.x}px; top: {submitButtonPosition.y}px;"
		onclick={() => {
			replaceWord(selectedElement?.textContent ?? '', selectedWord, selectedElement!);
			selectedWord = '';
		}}
	>
		Replace
	</Button>
{/if}

<style>
	:global(.hv) {
		display: inline-block;
		padding: 0 2px;
		border-radius: 2px;
		cursor: pointer;
	}

	:global(.hv:hover) {
		background: hsl(var(--primary) / 20%);
	}

	:global(.shake) {
		animation: shake 0.5s linear infinite;
	}

	:global(.selected) {
		font-weight: bold;
		background: hsl(var(--primary) / 30%);
	}

	:global(.word-exit) {
		animation: wordExit 0.3s ease-out;
	}

	:global(.word-enter) {
		animation: wordEnter 0.5s ease-out;
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-1px) rotate(-1deg);
		}
		75% {
			transform: translateX(1px) rotate(1deg);
		}
	}

	@keyframes wordExit {
		0% {
			transform: scale(1);
			filter: brightness(1);
			opacity: 1;
		}
		100% {
			transform: scale(0.8) translateY(-10px);
			filter: brightness(1.5);
			opacity: 0;
		}
	}

	@keyframes wordEnter {
		0% {
			transform: scale(1.2) translateY(10px);
			filter: brightness(2);
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		60% {
			transform: scale(1.1);
			filter: brightness(1.5);
		}
		80% {
			transform: scale(0.95);
			filter: brightness(1.2);
		}
		100% {
			transform: scale(1);
			filter: brightness(1);
		}
	}
</style>
