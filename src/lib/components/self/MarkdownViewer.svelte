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
	import FloatingWord from './FloatingWord.svelte';
	import { WordProcessor } from '$lib/utils/wordProcessor';

	let {
		content,
		title = '',
		showSidebars = true,
		showHeader = false,
		isEditPage = false,
		article = { title, content },
		onWordChange,
		selectedWord = '',
		selfId = '',
		ws
	} = $props<{
		content: string;
		title?: string;
		showSidebars?: boolean;
		showHeader?: boolean;
		isEditPage?: boolean;
		article?: Partial<Article>;
		selectedWord?: string;
		onWordChange: (data: { oldWord: string; newWord: string; wordIndex: number }) => void;
		selfId?: string;
		ws?: WebSocket | null;
	}>();

	const wordProcessor = new WordProcessor(content);

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
	let leaveTimeout: ReturnType<typeof setTimeout> | null = null;

	let otherUsersHovers = $state<{
		[editorId: string]: {
			word: string;
			wordIndex: number;
			editorName: string;
			editorImage: string;
		};
	}>({});

	function handleElementHover(element: HTMLElement, self: boolean = true) {
		if (!selectedWord && self) return;
		element.classList.add('shake');

		if (self) hoverTimeout = setTimeout(() => handleHover(element), 150);
	}

	async function handleElementLeave(element: HTMLElement) {
		element.classList.remove('shake');

		if (hoverTimeout) {
			clearTimeout(hoverTimeout);
			hoverTimeout = null;
		}

		if (leaveTimeout) {
			clearTimeout(leaveTimeout);
		}

		leaveTimeout = setTimeout(async () => {
			const actualIndex = wordProcessor.wordIndicesMap.get(element);
			if (actualIndex !== undefined) {
				try {
					await fetch(`/api/articles/${article.slug}/hover`, {
						method: 'DELETE',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							wordIndex: actualIndex
						})
					});
				} catch (error) {
					console.error('Failed to send hover leave:', error);
				}
			}
		}, 125);
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

	async function handleHover(element: HTMLElement) {
		if (!selectedWord || !article?.slug) return;

		const actualIndex = wordProcessor.wordIndicesMap.get(element);
		if (actualIndex === undefined) return;

		try {
			const response = await fetch(`/api/articles/${article.slug}/hover`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					wordIndex: actualIndex,
					newWord: selectedWord
				})
			});

			if (!response.ok) throw new Error('Hover update failed');

			const data = await response.json();
			console.log('Hover preview:', data);
		} catch (error) {
			console.error('Failed to send hover update:', error);
		}
	}

	$effect(() => {
		if (!ws) return;

		let currentHoveredElement: HTMLElement | null = null;

		ws.addEventListener('message', (event: { data: string }) => {
			const data = JSON.parse(event.data);

			if (data.type === 'word_hover') {
				const { editorId, editorName, newWord, editorImage, wordIndex } = data.data;

				if (editorId === selfId) return;

				if (currentHoveredElement) handleElementLeave(currentHoveredElement);

				const element = wordProcessor.getElementByWordIndex(wordIndex);
				if (element) {
					currentHoveredElement = element;
					handleElementHover(element, false);
				}

				otherUsersHovers = {
					...otherUsersHovers,
					[editorId]: {
						word: newWord,
						wordIndex,
						editorName,
						editorImage
					}
				};
			} else if (data.type === 'word_leave' || data.type === 'user_disconnected') {
				const { editorId } = data.data;

				const userHover = otherUsersHovers[editorId];
				if (userHover) {
					const element = wordProcessor.getElementByWordIndex(userHover.wordIndex);
					if (element) {
						handleElementLeave(element);
					}
				}

				const newHovers = { ...otherUsersHovers };
				delete newHovers[editorId];
				otherUsersHovers = newHovers;
			}
		});
	});

	$effect(() => {
		if (!isEditPage) return;

		const content = document.querySelector('.markdown-content');
		if (!content) return;

		wordProcessor.wordIndicesMap.clear();

		content
			.querySelectorAll('a')
			.forEach((link) => link.addEventListener('click', (e) => e.preventDefault()));

		content.querySelectorAll('p, h1, h2, h3, h4, h5, h6, a, li').forEach((element) => {
			wordProcessor.wrapTextNodes(
				element,
				handleElementHover,
				handleElementLeave,
				handleElementClick
			);
		});

		console.log(wordProcessor.wordIndicesMap);
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
			wordProcessor.replaceWord(
				selectedElement?.textContent ?? '',
				selectedWord,
				selectedElement!,
				onWordChange
			);
			selectedWord = '';
		}}
	>
		Replace
	</Button>
{/if}

{#each Object.entries(otherUsersHovers) as [_, hover]}
	{#if true}
		{@const element = wordProcessor.getElementByWordIndex(hover.wordIndex)}
		{@const rect = element?.getBoundingClientRect()}
		{#if element && rect}
			<FloatingWord word={hover.word} x={rect.left} y={rect.top - 10} image={hover.editorImage} />
		{/if}
	{/if}
{/each}

<style>
	:global(.hv) {
		display: inline-block;
		padding: 0 2px;
		border-radius: 2px;
		cursor: pointer;
	}

	:global(.shake) {
		animation: shake 0.5s linear infinite;
		background: hsl(var(--primary) / 20%);
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
