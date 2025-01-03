<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from 'lucide-svelte';
	import type { Article, Revision } from '$lib/server/db/schema';

	let { data } = $props<{ data: { article: Article; history: Revision[] } }>();

	function formatDate(date: string) {
		return new Date(date).toLocaleString();
	}
</script>

<div class="container mx-auto py-8">
	<div class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button variant="ghost" href="./" class="p-2">
				<ArrowLeft class="h-5 w-5" />
			</Button>
			<div>
				<h1 class="text-3xl font-bold">Revision History</h1>
				<p class="text-muted-foreground">
					for article: {data.article.title}
				</p>
			</div>
		</div>
	</div>

	<div class="space-y-4">
		{#each data.history as revision}
			<div class="rounded-lg border p-4">
				<div class="mb-2 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<span class="text-sm text-muted-foreground">
							Changed by {revision.createdBy}
						</span>
						<span class="text-sm text-muted-foreground">
							at {formatDate(revision.createdAt)}
						</span>
					</div>
				</div>
				<div class="rounded bg-muted p-2">
					<p class="text-sm">
						Changed word at position {revision.wordIndex + 1}:
						<span class="text-destructive line-through">{revision.wordChanged}</span>
					</p>
				</div>
			</div>
		{/each}

		{#if data.history.length === 0}
			<div class="rounded-lg border p-4">
				<p class="text-muted-foreground">No revisions found</p>
			</div>
		{/if}
	</div>
</div>
