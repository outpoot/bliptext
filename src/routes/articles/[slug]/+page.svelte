<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Clock, History } from 'lucide-svelte';
	import type { Article } from '$lib/server/db/schema';

	let { data } = $props<{ data: { article: Article } }>();

	let date = $state(new Date(data.article.updatedAt));
</script>

<div class="container mx-auto py-8">
	<div class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button variant="ghost" href="/" class="p-2">
				<ArrowLeft class="h-5 w-5" />
			</Button>
			<h1 class="text-3xl font-bold">{data.article.title}</h1>
		</div>

		<div class="flex items-center gap-2 text-sm text-muted-foreground">
			<Clock class="h-4 w-4" />
			<time datetime={date.toISOString()}>
				{date.toLocaleDateString()}
			</time>
            <Button variant="ghost" href={`${data.article.slug}/edit`} class="ml-4">Edit</Button>
            <Button variant="ghost" href={`${data.article.slug}/history`}>
                <History class="mr-2 h-4 w-4" />
                History
            </Button>
		</div>
	</div>

	<article class="prose prose-neutral dark:prose-invert max-w-none">
		{data.article.content}
	</article>
</div>
