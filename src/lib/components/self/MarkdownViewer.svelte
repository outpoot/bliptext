<script lang="ts">
	import type { Article } from '$lib/server/db/schema';
	import Markdown from 'svelte-exmarkdown';
	import { gfmPlugin } from 'svelte-exmarkdown/gfm';
	import type { Plugin } from 'svelte-exmarkdown';
	import rehypeHighlight from 'rehype-highlight';
	import 'highlight.js/styles/github-dark.css';

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
		onWordHover = () => {},
		onWordChange,
		selectedWord = '' // Add this prop
	} = $props<{
		content: string;
		title?: string;
		showSidebars?: boolean;
		showHeader?: boolean;
		isEditPage?: boolean;
		article?: Partial<Article>;
		onWordHover?: (word: string) => void;
		selectedWord?: string;
		onWordChange: (data: { oldWord: string; newWord: string }) => void;
	}>();

	const highlightPlugin: Plugin = { rehypePlugin: [rehypeHighlight, { ignoreMissing: true }] };
	const plugins: Plugin[] = [
		gfmPlugin(),
		highlightPlugin,
		{
			renderer: {
				h1: WikiBox,
				// @ts-ignore
				p: Summary
			}
		}
	];

	let selectedElement: HTMLElement | null = $state(null);
	let showSubmitButton = $state(false);
	let submitButtonPosition = $state({ x: 0, y: 0 });

	function replaceWord(oldWord: string, newWord: string, element: HTMLElement) {
		element.classList.remove('selected', 'shake');
		element.classList.add('word-exit');

		// Sequence the animations
		setTimeout(() => {
			element.textContent = newWord;
			element.classList.remove('word-exit');
			element.classList.add('word-enter');

			setTimeout(() => {
				element.classList.remove('word-enter');
			}, 500);
		}, 300);

		showSubmitButton = false;
		selectedElement = null;
		onWordChange?.({ oldWord, newWord });
	}

	function wrapTextNodes(element: Element) {
		// find all the text nodes in the element
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
			acceptNode: (node) => {
				// skip empty text nodes or those that are only whitespace
				if (!node.textContent?.trim()) {
					return NodeFilter.FILTER_REJECT;
				}
				// skip if parent is already hv
				if (node.parentElement?.classList.contains('hv')) {
					return NodeFilter.FILTER_REJECT;
				}
				return NodeFilter.FILTER_ACCEPT;
			}
		});

		const nodes: Text[] = [];
		let node;
		while ((node = walker.nextNode())) {
			nodes.push(node as Text);
		}

		// process in reverse to avoid affecting the walker
		nodes.reverse().forEach((textNode) => {
			const words = textNode.textContent?.split(/\s+/) ?? [];
			const fragment = document.createDocumentFragment();

			words.forEach((word, i) => {
				const span = document.createElement('span');
				span.textContent = word;
				span.className = 'hv';

				span.addEventListener('mouseenter', () => {
					if (!selectedWord) return;

					onWordHover(word);
					span.classList.add('shake');
				});
				span.addEventListener('mouseleave', () => span.classList.remove('shake'));

				span.addEventListener('click', (e) => {
					if (!selectedWord) return;
					if (selectedElement) selectedElement.classList.remove('selected');

					selectedElement = span;
					span.classList.add('selected');

					const rect = span.getBoundingClientRect();
					submitButtonPosition = {
						x: rect.left,
						y: rect.top - 40
					};
					showSubmitButton = true;
				});

				fragment.appendChild(span);
				if (i < words.length - 1) {
					fragment.appendChild(document.createTextNode(' '));
				}
			});

			textNode.parentNode?.replaceChild(fragment, textNode);
		});
	}

	$effect(() => {
		if (!isEditPage) return;

		const content = document.querySelector('.markdown-content');
		if (!content) return;

		// Prevent link clicks in edit mode
		const links = content.querySelectorAll('a');
		links.forEach((link) => {
			link.addEventListener('click', (e) => {
				e.preventDefault();
			});
		});

		const textContainers = content.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, li'); // editable elements
		textContainers.forEach(wrapTextNodes);
	});
</script>

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
			selectedWord = ''; // Reset the selected word
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

	:global(.sparkle) {
		display: none;
	}

	@keyframes float-in {
		from {
			transform: translateY(-10px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
