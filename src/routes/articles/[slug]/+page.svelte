<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import FileText from 'lucide-svelte/icons/file-text';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';

	import type { Article } from '$lib/server/db/schema';

	import type { Plugin } from 'svelte-exmarkdown';
	import Markdown from 'svelte-exmarkdown';
	import { gfmPlugin } from 'svelte-exmarkdown/gfm';
	import rehypeHighlight from 'rehype-highlight';
	import 'highlight.js/styles/github-dark.css';
	import WikiBox from '$lib/components/self/WikiBox.svelte';
	import TableOfContents from '$lib/components/self/TableOfContents.svelte';
	import Tools from '$lib/components/self/Tools.svelte';
	import Summary from '$lib/components/self/Summary.svelte';

	let { data } = $props<{ data: { article: Article } }>();

	// https://ssssota.github.io/svelte-exmarkdown/docs/04-skip-render
	const highlightPlugin: Plugin = { rehypePlugin: [rehypeHighlight, { ignoreMissing: true }] };
	const plugins: Plugin[] = [
		gfmPlugin(),
		highlightPlugin,
		{
			renderer: {
				h1: WikiBox,
				// @ts-ignore
				p: Summary
			}
		}
	];
</script>

<div class="container-2xl mx-auto py-8">
	<div class="flex gap-6">
		<div class="w-64 pt-16">
			<TableOfContents content={data.article.content} title={data.article.title} />
		</div>

		<div class="flex-1">
			<div class="mb-4 flex items-baseline gap-2">
				<FileText class="h-5 w-5 text-muted-foreground" />
				<h1 id="title" class="text-3xl font-bold">{data.article.title}</h1>
			</div>
			<Separator class="mb-8" />

			<div class="markdown-content">
				<Markdown md={data.article.content} {plugins} />
			</div>
		</div>

		<div class="w-64 pt-16">
			<Tools article={data.article} />
		</div>
	</div>
</div>
