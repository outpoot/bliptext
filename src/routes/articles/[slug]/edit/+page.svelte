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
	import { activeUsers } from '$lib/stores/activeUsers';

	let { data } = $props<{ data: { article: Article | null; session: Session } }>();

	let article = $state(data.article);
	let ws: WebSocket | null = $state(null);

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

	$effect(() => {
		if (!selectedWord) {
			showFloatingWord = false;
		}
	});

	onMount(() => {
		(async () => {
			const token = data.session.data.session.token;

			if (!token || !data.article) return;

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
					toast.error('Disconnected: You opened this article on another device.', {
						duration: Infinity
					});
				}
			});

			ws.addEventListener('message', (event) => {
				const data = JSON.parse(event.data);
				if (data.type === 'active_users_update') {
					$activeUsers = data.data.count;
				}
			});
		})();

		return () => {
			ws?.close();
			ws = null;
			$activeUsers = 0;
		};
	});
</script>

<svelte:window onmousemove={handleMouseMove} />

{#if $currentUser?.isBanned}
	<div class="container mx-auto py-8">
		<div class="rounded-lg bg-destructive/10 p-4 text-destructive">
			<p>Access to article editing has been restricted due to an account suspension.</p>
			<br />
			<p>
				While suspensions are carefully reviewed and rarely incorrect, you may <a
					href="https://discord.gg/cKWNV2uZUP"
					class="text-primary hover:underline">appeal here</a
				>. Note that banned accounts may also be restricted from the Discord server.
			</p>
			<br />
			<p>
				During this suspension period (indefinite), your account has limited access to interactive
				features, including article editing and viewing active content.
			</p>
		</div>
	</div>
{:else if data.article}
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
					bind:selectedWord
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
