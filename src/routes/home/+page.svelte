<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import Users from 'lucide-svelte/icons/users';
	import { getSession } from '$lib/auth-client';
	import { PUBLIC_WEBSOCKET_URL } from '$env/static/public';
	import { toast } from 'svelte-sonner';

	let activeArticles = $state<
		Array<{
			id: string;
			title: string;
			slug: string;
			activeUsers: number;
		}>
	>([]);

	async function initializeWebSocket(token: string) {
		const ws = new WebSocket(`${PUBLIC_WEBSOCKET_URL}?token=${token}&type=viewer`);

		ws.addEventListener('open', () => {
			ws.send(JSON.stringify({ type: 'get_active_articles' }));
		});

		ws.addEventListener('message', (event) => {
			const data = JSON.parse(event.data);
			if (data.type === 'active_articles') {
				activeArticles = data.data.sort((a, b) => b.activeUsers - a.activeUsers);
			}
		});

		return ws;
	}

	async function getWebSocketToken() {
		const res = await fetch('/api/generate-ws-token');

		if (!res.ok) {
			if (res.status === 401) {
				toast.error('Your account is restricted from editing');
			}
			throw new Error('Failed to connect');
		}

		return (await res.json()).token;
	}

	onMount(() => {
		let interval: ReturnType<typeof setInterval>;
		let ws: WebSocket;

		(async () => {
			const { data } = await getSession();
			if (!data?.session) return;

			const token = await getWebSocketToken();
			ws = await initializeWebSocket(token);

			interval = setInterval(() => {
				if (ws.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify({ type: 'get_active_articles' }));
				}
			}, 5000);
		})();

		return () => {
			clearInterval(interval);
			if (ws) ws.close();
		};
	});
</script>

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
