<script lang="ts">
	import type { Article } from '$lib/server/db/schema';
	import MarkdownViewer from '$lib/components/self/MarkdownViewer.svelte';
	import FloatingWord from '$lib/components/self/FloatingWord.svelte';
	import TableOfContents from '$lib/components/self/TableOfContents.svelte';
	import Tools from '$lib/components/self/Tools.svelte';
	import { onMount } from 'svelte';
	import { currentUser } from '$lib/stores/user';
	import type { Session } from 'better-auth';
	import { toast } from 'svelte-sonner';

	let { data } = $props<{ data: { article: Article | null; session: Session } }>();

	let article = $state(data.article);
	let ws: WebSocket | null = $state(null);

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

	async function handleWordChanged({
		wordIndex,
		newWord
	}: {
		oldWord: string;
		newWord: string;
		wordIndex: number;
	}) {
		const res = await fetch(`/api/articles/${data.article.slug}/word`, {
			method: 'PUT',
			body: JSON.stringify({ wordIndex, newWord })
		});

		if (!res.ok) {
			const { error, article: oldArticle } = await res.json();
			toast.error(error);
			article = oldArticle;

			return;
		}

		selectedWord = '';
		showFloatingWord = false;
	}

	onMount(() => {
		(async () => {
			const token = data.session.data.session.token;
			console.log(token);
			if (!token || !data.article) return;

			// Connect to WebSocket
			ws = new WebSocket(`ws://localhost:8080?token=${token}&type=editor`);

			ws.addEventListener('open', () => {
				console.log('Connected to WebSocket');
				ws?.send(
					JSON.stringify({
						type: 'set_article',
						article: {
							id: data.article?.id,
							slug: data.article?.slug
						}
					})
				);
			});

			ws.addEventListener('error', (error) => {
				console.error('WebSocket error:', error);
			});

			ws.addEventListener('close', (event) => {
				console.log('WebSocket closed:', event.code, event.reason);
				if (event.code === 4000) {
					toast.error('Disconnected: You opened this article on another device.', { duration: Infinity });
				}
			});

			ws.addEventListener('message', (event) => {
				const data = JSON.parse(event.data);
				console.log(data);
				if (data.type === 'word_hover') {
					const { content: newContent } = data.data;
					content = newContent;
				}
			});
		})();

		return () => {
			ws?.close();
			ws = null;
		};
	});
</script>

<svelte:window onmousemove={handleMouseMove} />

{#if data.article}
	<div class="container-2xl mx-auto py-8">
		<div class="flex gap-6">
			<div class="w-64 pt-16">
				<TableOfContents
					content={article.content}
					title={article.title}
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
					content={article.content}
					title={article.title}
					{article}
					showHeader={true}
					showSidebars={false}
					isEditPage={true}
					onWordChange={handleWordChanged}
					{selectedWord}
					{ws}
					selfId={$currentUser?.id}
				/>
			</div>

			<div class="w-64 pt-16">
				<Tools {article} isEditPage={true} />
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
