<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import type { Article } from '$lib/server/db/schema';

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

	function handleKeyDown(e: KeyboardEvent) {
		if (!wordsArray.length) return;

		switch (e.key) {
			case 'ArrowLeft':
				e.preventDefault();
				if (selectedIndex > 0) {
					selectedIndex = selectedIndex - 1;
					selectedWord = wordsArray[selectedIndex].word;
				}
				break;
			case 'ArrowRight':
				e.preventDefault();
				if (selectedIndex < wordsArray.length - 1) {
					selectedIndex = selectedIndex + 1;
					selectedWord = wordsArray[selectedIndex].word;
				}
				break;
			case 'Enter':
				if (selectedIndex !== -1) {
					handleWordUpdate();
				}
				break;
		}
	}
</script>

{#if data.article}
	<div class="container mx-auto py-8">
		<div class="mb-8 flex items-center justify-between">
			<div class="flex items-center gap-4">
				<Button variant="ghost" href="./" class="p-2">
					<ArrowLeft class="h-5 w-5" />
				</Button>
				<h1 class="text-3xl font-bold">Edit: {data.article.title}</h1>
			</div>
		</div>

		<div class="mb-6 flex items-end gap-4">
			<div class="flex-1">
				<Input
					value={selectedWord}
					oninput={(e) => (selectedWord = e.currentTarget.value)}
					placeholder="Select a word to edit"
					disabled={selectedIndex === -1}
					onkeydown={handleKeyDown}
				/>
			</div>
			<Button
				onclick={handleWordUpdate}
				disabled={!selectedWord || selectedIndex === -1 || isEditing}
			>
				{isEditing ? 'Updating...' : 'Update Word'}
			</Button>
		</div>

		<article
			class="prose prose-neutral dark:prose-invert max-w-none"
			aria-label="Article content editor"
		>
			{#each wordsArray as { word, index } (index)}
				<Button
					variant="ghost"
					class="inline-block h-auto px-1 py-0.5 {selectedIndex === index ? 'bg-primary/20' : ''}"
					data-index={index}
					onclick={() => handleWordClick(word, index)}
					aria-current={selectedIndex === index ? 'true' : undefined}
				>
					{word}
				</Button>
			{/each}
		</article>
	</div>
{:else}
	<div class="container mx-auto py-8">
		<p class="text-muted-foreground">Article not found</p>
	</div>
{/if}
