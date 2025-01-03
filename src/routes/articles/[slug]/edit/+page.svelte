<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { ArrowLeft } from 'lucide-svelte';
	import type { Article } from '$lib/server/db/schema';

	let { data } = $props<{ data: { article: Article | null } }>();

	let content = $state(data.article?.content ?? '');
	let words = $derived(content.split(/\s+/));
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
				/>
			</div>
			<Button
				onclick={handleWordUpdate}
				disabled={!selectedWord || selectedIndex === -1 || isEditing}
			>
				{isEditing ? 'Updating...' : 'Update Word'}
			</Button>
		</div>

		<div class="prose prose-neutral dark:prose-invert max-w-none">
			{#each words as word, i}
				<button
					type="button"
					class="inline-block cursor-pointer rounded px-1 py-0.5 hover:bg-muted {selectedIndex === i
						? 'bg-primary/20'
						: ''}"
					onclick={() => handleWordClick(word, i)}
					onkeydown={(e) => e.key === 'Enter' && handleWordClick(word, i)}
				>
					{word}
				</button>
			{/each}
		</div>
	</div>
{:else}
	<div class="container mx-auto py-8">
		<p class="text-muted-foreground">Article not found</p>
	</div>
{/if}
