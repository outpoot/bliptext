<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import Users from 'lucide-svelte/icons/users';
	import { getSession } from '$lib/auth-client';
	import WebSocketManager, {
		type WebSocketManagerHandle
	} from '$lib/components/self/WebSocketManager.svelte';

	let activeArticles = $state<
		Array<{
			id: string;
			title: string;
			slug: string;
			activeUsers: number;
		}>
	>([]);

	let wsManager = $state<WebSocketManagerHandle | undefined>();
	let interval = $state<ReturnType<typeof setInterval>>();

	function handleMessage(data: any) {
		if (data.type === 'active_articles') {
			activeArticles = data.data.sort(
				(a: { activeUsers: number }, b: { activeUsers: number }) => b.activeUsers - a.activeUsers
			);
		}
	}

	function handleOpen() {
		wsManager?.send({ type: 'get_active_articles' });
	}

	onMount(() => {
		getSession().then(({ data }) => {
			if (!data?.session) return;

			interval = setInterval(() => {
				wsManager?.send({ type: 'get_active_articles' });
			}, 5000);
		});

		return () => {
			if (interval) clearInterval(interval);
		};
	});
</script>

<WebSocketManager
	bind:this={wsManager}
	type="viewer"
	onMessage={handleMessage}
	onOpen={handleOpen}
/>

<div class="container mx-auto py-8">
	<h1 class="mb-8 text-4xl font-bold">Home</h1>

	<Separator class="mb-4" />
	<h1 class="mb-8 text-xl font-bold">Most active articles</h1>

	{#if activeArticles.length > 0}
		<div class="grid gap-4">
			{#each activeArticles as article}
				<Button
					variant="ghost"
					class="flex items-center justify-between p-4 hover:bg-muted"
					onclick={() => goto(`/articles/${article.slug}/edit`)}
				>
					<span class="font-medium">{article.title}</span>
					<div class="flex items-center gap-2">
						<Users class="h-4 w-4" />
						<Badge variant="secondary">{article.activeUsers}</Badge>
					</div>
				</Button>
				<Separator />
			{/each}
		</div>
	{:else}
		<p class="text-muted-foreground">No active articles at the moment.</p>
	{/if}
</div>
