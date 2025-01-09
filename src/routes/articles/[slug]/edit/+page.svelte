<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import type { Article } from '$lib/server/db/schema';
	import MarkdownViewer from '$lib/components/self/MarkdownViewer.svelte';

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
	<div class="container-2xl mx-auto py-8">
		<MarkdownViewer
			content={data.article.content}
			title={data.article.title}
			article={data.article}
			showHeader={true}
			isEditPage={true}
		/>
	</div>
{:else}
	<div class="container mx-auto py-8">
		<p class="text-muted-foreground">Article not found</p>
	</div>
{/if}
