<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import type { Article } from '$lib/server/db/schema';
	import MarkdownViewer from '$lib/components/self/MarkdownViewer.svelte';
	import FloatingWord from '$lib/components/self/FloatingWord.svelte';

	let { data } = $props<{ data: { article: Article | null } }>();

	let content = $state(data.article?.content ?? '');

	interface WordItem {
		word: string;
		index: number;
	}

	let wordsArray: WordItem[] = $state([]);

	$effect(() => {
		const words = content.split(/\s+/);
		wordsArray = words.map(
			(word: string, index: number): WordItem => ({
				word,
				index
			})
		);
	});

	let selectedWord = $state('');
	let selectedIndex = $state(-1);
	let isEditing = $state(false);

	let mouseX = $state(0);
	let mouseY = $state(0);
	let showFloatingWord = $state(false);
	let hoveredWord = $state('');

	function handleMouseMove(e: MouseEvent) {
		mouseX = e.clientX;
		mouseY = e.clientY;
	}

	function handleInputKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && selectedWord) {
			showFloatingWord = true;
		} else if (e.key === 'Escape') {
			showFloatingWord = false;
		}
	}

	function handleWordHover(word: string) {
		hoveredWord = word;
		console.log('Hovering over:', word);
	}

	function handleWordClick(word: string, index: number) {
		selectedWord = word;
		selectedIndex = index;
	}

	async function handleWordUpdate() {
		if (!selectedWord || selectedIndex === -1 || !data.article) return;

		isEditing = true;
		try {
			const response = await fetch(`/api/articles/${data.article.slug}/word`, {
				method: 'PUT',
				body: JSON.stringify({
					wordIndex: selectedIndex,
					newWord: selectedWord
				})
			});

			if (response.ok) {
				const { newContent } = await response.json();
				content = newContent;
				selectedWord = '';
				selectedIndex = -1;
			}
		} finally {
			isEditing = false;
		}
	}
</script>

<svelte:window on:mousemove={handleMouseMove} />

{#if data.article}
	<div class="container-2xl mx-auto py-8">
		<div class="flex-1 mb-8">
			<Input
				value={selectedWord}
				oninput={(e) => (selectedWord = e.currentTarget.value)}
				onkeydown={handleInputKeyDown}
				placeholder="Select a word to edit"
			/>
			{#if hoveredWord}
				<p class="text-sm text-muted-foreground mt-2">Hovering: {hoveredWord}</p>
			{/if}
		</div>

		<MarkdownViewer
			content={data.article.content}
			title={data.article.title}
			article={data.article}
			showHeader={true}
			isEditPage={true}
			onWordHover={handleWordHover}
		/>

		{#if showFloatingWord && selectedWord}
			<FloatingWord
				word={selectedWord}
				x={mouseX + 10}
				y={mouseY + 10}
			/>
		{/if}
	</div>
{:else}
	<div class="container mx-auto py-8">
		<p class="text-muted-foreground">Article not found</p>
	</div>
{/if}
