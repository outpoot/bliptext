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

	let {
		content,
		title = '',
		showSidebars = true,
		showHeader = false,
		isEditPage = false,
		article = { title, content },
		onWordHover = (word: string) => {}
	} = $props<{
		content: string;
		title?: string;
		showSidebars?: boolean;
		showHeader?: boolean;
		isEditPage?: boolean;
		article?: Partial<Article>;
		onWordHover?: (word: string) => void;
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
					onWordHover(word);
					span.classList.add('shake');
				});
				span.addEventListener('mouseleave', () => span.classList.remove('shake'));

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

		const textContainers = content.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, li'); // editable elements
		textContainers.forEach(wrapTextNodes);
	});
</script>

{#if showSidebars}
	<div class="flex gap-6">
		<div class="w-64 pt-16">
			<TableOfContents {content} {title} />
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
	<div class="markdown-content">
		<Markdown md={content} {plugins} />
	</div>
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
</style>
