<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import type { Article } from '$lib/server/db/schema';
	import MarkdownViewer from '$lib/components/self/MarkdownViewer.svelte';
	import FloatingWord from '$lib/components/self/FloatingWord.svelte';
	import TableOfContents from '$lib/components/self/TableOfContents.svelte';
	import Tools from '$lib/components/self/Tools.svelte';

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

	let mouseX = $state(0);
	let mouseY = $state(0);
	let showFloatingWord = $state(false);

	function handleMouseMove(e: MouseEvent) {
		mouseX = e.clientX;
		mouseY = e.clientY;
	}

	function handleInputKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && selectedWord) {
			showFloatingWord = true;
		} else if (e.key === 'Escape') {
			showFloatingWord = false;
		} else if (e.key === ' ') {
			e.preventDefault(); // Prevent spaces
		}
	}

	function handleInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const newWord = input.value.replace(/\s+/g, '').slice(0, 45);
		selectedWord = newWord;
		showFloatingWord = Boolean(newWord); // Show only if we have a word
	}

	function handleWordChanged() {
		selectedWord = '';
		showFloatingWord = false;
	}
</script>

<svelte:window onmousemove={handleMouseMove} />

{#if data.article}
	<div class="container-2xl mx-auto py-8">
		<div class="flex gap-6">
			<div class="w-64 pt-16">
				<TableOfContents
					content={data.article.content}
					title={data.article.title}
					wordInput={true}
					inputProps={{
						onkeydown: handleInputKeyDown,
						oninput: handleInput,
						value: selectedWord
					}}
				/>

				<div class="sticky top-4"></div>
			</div>

			<div class="flex-1">
				<MarkdownViewer
					content={data.article.content}
					title={data.article.title}
					article={data.article}
					showHeader={true}
					showSidebars={false}
					isEditPage={true}
					onWordHover={() => {}}
					onWordChange={handleWordChanged}
					{selectedWord}
				/>
			</div>

			<div class="w-64 pt-16">
				<Tools article={data.article} isEditPage={true} />
			</div>
		</div>

		{#if showFloatingWord && selectedWord}
			<FloatingWord word={selectedWord} x={mouseX + 10} y={mouseY + 10} />
		{/if}
	</div>
{:else}
	<div class="container mx-auto py-8">
		<p class="text-muted-foreground">Article not found</p>
	</div>
{/if}
