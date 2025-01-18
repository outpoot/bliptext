<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import Users from 'lucide-svelte/icons/users';
	import { getSession } from '$lib/auth-client';

	let ws: WebSocket | null = null;
	let activeArticles = $state<
		Array<{
			id: string;
			title: string;
			slug: string;
			activeUsers: number;
		}>
	>([]);

	onMount(() => {
		let initialized = false;

		getSession().then(({ data }) => {
			if (!initialized && data?.session) {
				ws = new WebSocket(`ws://localhost:8080?token=${data.session?.token}&type=viewer`);

				ws.addEventListener('open', () => {
					ws?.send(JSON.stringify({ type: 'get_active_articles' }));
				});

				ws.addEventListener('message', (event) => {
					const data = JSON.parse(event.data);
					if (data.type === 'active_articles') {
						activeArticles = data.data.sort((a, b) => b.activeUsers - a.activeUsers);
					}
				});
			}
		});

		// Periodically refresh active articles
		const interval = setInterval(() => {
			if (ws?.readyState === WebSocket.OPEN) {
				ws.send(JSON.stringify({ type: 'get_active_articles' }));
			}
		}, 5000);

		return () => {
			initialized = true;
			clearInterval(interval);
			ws?.close();
		};
	});
</script>

<div class="container mx-auto py-8">
	<h1 class="mb-8 text-4xl font-bold">Active Articles</h1>

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
