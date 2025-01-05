<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import Clock from 'lucide-svelte/icons/clock';
	import History from 'lucide-svelte/icons/history';

	import type { Article } from '$lib/server/db/schema';

	import type { Plugin } from 'svelte-exmarkdown';
	import Markdown from 'svelte-exmarkdown';
	import { gfmPlugin } from 'svelte-exmarkdown/gfm';
	import rehypeHighlight from 'rehype-highlight';
	import 'highlight.js/styles/github-dark.css';
	import WikiBox from '$lib/components/self/WikiBox.svelte';

	let { data } = $props<{ data: { article: Article } }>();
	let date = $state(new Date(data.article.updatedAt));

	// https://ssssota.github.io/svelte-exmarkdown/docs/04-skip-render
	const highlightPlugin: Plugin = { rehypePlugin: [rehypeHighlight, { ignoreMissing: true }] };
	const plugins: Plugin[] = [
		gfmPlugin(),
		highlightPlugin,
		{
			renderer: {
				h1: WikiBox
			}
		}
	];

	function goBack() {
		history.back();
	}
</script>

<div class="container mx-auto py-8">
	<div class="mb-8 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<Button variant="ghost" href="/" class="p-2" onclick={goBack}>
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

	<div class="markdown-content">
		<Markdown md={data.article.content} {plugins} />
	</div>
</div>
