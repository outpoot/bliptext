<script lang="ts">
	import type { Article } from '$lib/server/db/schema';
	import Markdown from 'svelte-exmarkdown';
	import { gfmPlugin } from 'svelte-exmarkdown/gfm';
	import type { Plugin } from 'svelte-exmarkdown';
	import rehypeHighlight from 'rehype-highlight';
	import 'highlight.js/styles/github-dark.css';

	import WikiBox from '$lib/components/self/WikiBox.svelte';
	import Summary from '$lib/components/self/Summary.svelte';

	import TableOfContents from './TableOfContents.svelte';
	import Tools from './Tools.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import FileText from 'lucide-svelte/icons/file-text';

	let {
		content,
		title = '',
		showSidebars = true,
		showHeader = false,
		isEditPage = false,
		article = { title, content }
	} = $props<{
		content: string;
		title?: string;
		showSidebars?: boolean;
		showHeader?: boolean;
		isEditPage?: boolean;
		article?: Partial<Article>;
	}>();

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

{#if showSidebars}
	<div class="flex gap-6">
		<div class="w-64 pt-16">
			<TableOfContents {content} {title} />
		</div>

		<div class="flex-1">
			{#if showHeader}
				<div class="mb-4 flex items-baseline gap-2">
					<FileText class="h-5 w-5 text-muted-foreground" />
					<h1 id="title" class="text-3xl font-bold">{article.title || "Untitled"}</h1>
				</div>
				<Separator class="mb-8" />
			{/if}

			<div class="markdown-content">
				<Markdown md={content} {plugins} />
			</div>
		</div>

		<div class="w-64 pt-16">
			<Tools {article} {isEditPage} />
		</div>
	</div>
{:else}
	<div class="markdown-content">
		<Markdown md={content} {plugins} />
	</div>
{/if}
