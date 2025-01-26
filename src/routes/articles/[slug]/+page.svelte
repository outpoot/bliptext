<script lang="ts">
	import type { Article } from '$lib/server/db/schema';
	import MarkdownViewer from '$lib/components/self/MarkdownViewer.svelte';

	let { data } = $props<{ data: { article: Article } }>();

	const summary = data.article.content
		?.split(':::')?.[2]
		.slice(200)
		.replace(/\*\*(.*?)\*\*/g, '$1')
		.replace(/([*_])(.*?)\1/g, '$2')
		.replace(/\[(.*?)\]\(.*?\)/g, '$1') + "...";
</script>

<svelte:head>
	<title>{'History: ' + data.article.title}</title>
	<meta name="description" content={summary} />
	<meta name="keywords" content="article, edit, markdown, wikipedia, wiki" />
	<meta property="og:title" content={data.article.title} />
	<meta property="og:description" content={summary} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={window.location.href} />
	<meta property="og:image" content="/favicon.svg" />
</svelte:head>

<div class="container-2xl mx-auto py-8">
	<MarkdownViewer
		content={data.article.content}
		title={data.article.title}
		article={data.article}
		showHeader={true}
	/>
</div>
