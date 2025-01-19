<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';

	import ArrowLeft from 'lucide-svelte/icons/arrow-left';

	import type { Article } from '$lib/server/db/schema';

	let query = $derived(page.url.searchParams.get('q') || '');
	let results = $state<Article[]>([]);
	let isLoading = $state(false);

	$effect(() => {
		if (query) {
			searchArticles(query);
		}
	});

	async function searchArticles(searchQuery: string) {
		isLoading = true;
		try {
			const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
			const data = await response.json();
			results = data.results;
		} finally {
			isLoading = false;
		}
	}

	function handleBack(e: MouseEvent) {
		e.preventDefault();
		history.back();
	}
</script>

<div class="container mx-auto py-8">
	<div class="mb-8 flex items-center gap-4">
		<Button variant="ghost" onclick={handleBack} class="p-2">
			<ArrowLeft class="h-5 w-5" />
		</Button>
		<div>
			<Label class="text-lg text-muted-foreground">Search results for</Label>
			<h1 class="text-3xl font-bold">{query}</h1>
		</div>
	</div>

	<div class="space-y-4">
		{#if isLoading}
			<div class="rounded-lg border p-4">
				<p class="text-muted-foreground">Searching...</p>
			</div>
		{:else if results.length === 0}
			<div class="rounded-lg border p-4">
				<p class="text-muted-foreground">No results found for "{query}"</p>
			</div>
		{:else}
			{#each results as article}
				<a
					href="/articles/{article.slug}"
					class="block rounded-lg border p-4 transition-colors hover:bg-muted"
				>
					<h2 class="text-xl font-semibold">{article.title}</h2>
					<p class="mt-2 text-sm text-muted-foreground">
						{article.content.slice(0, 200)}...
					</p>
				</a>
			{/each}
		{/if}
	</div>
</div>
