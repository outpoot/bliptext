<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import { Separator } from "$lib/components/ui/separator";
	import { goto } from "$app/navigation";

	export let data: {
		activeEditors?: Array<{
			id: string;
			name: string;
			image: string;
			revisionCount: number;
		}>;
		topArticles?: Array<{
			id: string;
			title: string;
			slug: string;
			revisionCount: number;
		}>;
	};
</script>

<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
	<div>
		<Separator class="mb-4" />
		<h2 class="mb-4 text-xl font-bold">Top editors</h2>
		
		{#if data.activeEditors?.length}
			<div class="grid gap-4">
				{#each data.activeEditors as editor}
					<div class="flex items-center justify-between p-2">
						<div class="flex items-center gap-2">
							<img src={editor.image} alt={editor.name} class="h-8 w-8 rounded-full" />
							<span class="font-medium">{editor.name}</span>
						</div>
						<Badge variant="secondary">{editor.revisionCount} edits</Badge>
					</div>
					<Separator />
				{/each}
			</div>
		{:else}
			<p class="text-muted-foreground">No editors found.</p>
		{/if}
	</div>

	<div>
		<Separator class="mb-4" />
		<h2 class="mb-4 text-xl font-bold">Most edited articles</h2>
		
		{#if data.topArticles?.length}
			<div class="grid gap-4">
				{#each data.topArticles as article}
					<Button
						variant="ghost"
						class="flex items-center justify-between p-4"
						onclick={() => goto(`/articles/${article.slug}`)}
					>
						<span class="font-medium">{article.title}</span>
						<Badge variant="secondary">{article.revisionCount} edits</Badge>
					</Button>
					<Separator />
				{/each}
			</div>
		{:else}
			<p class="text-muted-foreground">No articles found.</p>
		{/if}
	</div>
</div>
