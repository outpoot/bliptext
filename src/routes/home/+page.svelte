<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import { Separator } from "$lib/components/ui/separator";
	import Users from "lucide-svelte/icons/users";
	import WebSocketManager, {
		type WebSocketManagerHandle,
	} from "$lib/components/self/WebSocketManager.svelte";
	import { page } from "$app/state";
	import Leaderboard from "$lib/components/self/Leaderboard.svelte";

	let activeArticles = $state<any[]>([]);
	let leaderboardData = $state<any>();
	let wsManager = $state<WebSocketManagerHandle | undefined>();
	let interval = $state<ReturnType<typeof setInterval>>();

	function handleMessage(data: any) {
		if (data.type === "active_articles") {
			activeArticles = data.data.sort(
				(a: { activeUsers: number }, b: { activeUsers: number }) =>
					b.activeUsers - a.activeUsers,
			);
		}
	}

	function handleOpen() {
		wsManager?.send({ type: "get_active_articles" });
	}

	onMount(() => {
		(async () => {
			const response = await fetch("/api/leaderboard");
			if (response.ok) {
				leaderboardData = await response.json();
			}

			interval = setInterval(() => {
				wsManager?.send({ type: "get_active_articles" });
			}, 5000);
		})();

		return () => {
			if (interval) clearInterval(interval);
		};
	});
</script>

<svelte:head>
	<title>Bliptext</title>
	<meta
		name="description"
		content="A wiki where you can edit one word every 30 seconds. Let chaos ensue :)"
	/>
	<meta name="keywords" content="article, edit, markdown, wikipedia, wiki" />
	<meta property="og:title" content="Bliptext" />
	<meta
		property="og:description"
		content="A wiki where you can edit one word every 30 seconds. Let chaos ensue :)"
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content={page.url.href} />
</svelte:head>

<WebSocketManager
	bind:this={wsManager}
	type="viewer"
	onMessage={handleMessage}
	onOpen={handleOpen}
/>

<div class="container mx-auto py-8">
	<h1 class="mb-8 text-4xl font-bold">Home</h1>

	<div class="mb-8">
		<Separator class="mb-4" />
		<h2 class="mb-4 text-xl font-bold">Most active articles</h2>

		{#if activeArticles?.length > 0}
			<div class="grid gap-4">
				{#each activeArticles as article}
					<Button
						variant="ghost"
						class="flex items-center justify-between p-4 hover:bg-muted"
						onclick={() => goto(`/articles/${article.slug}/edit`)}
						aria-label={`Edit article: ${article.title}`}
					>
						<span class="font-medium">{article.title}</span>
						<div class="flex items-center gap-2">
							<Users class="h-4 w-4" />
							<Badge variant="secondary"
								>{article.activeUsers}</Badge
							>
						</div>
					</Button>
					<Separator />
				{/each}
			</div>
		{:else}
			<p class="text-muted-foreground">
				No active articles at the moment.
			</p>
		{/if}
	</div>

	{#if leaderboardData}
		<Leaderboard data={leaderboardData} />
	{/if}
</div>
