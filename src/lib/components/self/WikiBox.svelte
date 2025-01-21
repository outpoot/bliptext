<script lang="ts">
	import { getAstNode } from 'svelte-exmarkdown';

	function decodeWikiUrl(url: string) {
		if (!url) return url;
		return url.replace(/\/\/\//g, '_');
	}

	const astContext = getAstNode();
	const node = $astContext;
	const rawContent = node?.children?.[0]?.value ?? '';

	const bracketContent = rawContent.match(/\[(.*)\]/)?.[1] ?? '';
	const parts = bracketContent.split('|').map((s) => s.trim());
	const isWikiBox = parts.length >= 2 && parts.length <= 3;

	let title = '';
	let imageUrl = '';
	let content = '';

	if (isWikiBox) {
		[title, imageUrl, content = ''] = parts;

		if (imageUrl) {
			imageUrl = !imageUrl.startsWith('https://') ? `https://${imageUrl}` : imageUrl;
			imageUrl = decodeWikiUrl(imageUrl);
		}
	}
</script>

{#if isWikiBox}
	<figure class="wiki-image-box">
		{#if imageUrl}
			<img src={imageUrl} alt={title} />
		{/if}
		<figcaption>
			{#if title}
				<strong>{title}</strong>
			{/if}
			<div class="wiki-content">{content}</div>
		</figcaption>
	</figure>
{:else}
	<h1 class="mb-4 mt-6 text-4xl font-bold">
		{rawContent}
	</h1>
{/if}

<style>
	.wiki-image-box {
		@apply float-right clear-right mb-6 ml-4 max-w-[250px] overflow-hidden rounded-lg border bg-card;
	}

	figcaption {
		@apply border-t bg-muted/50 p-3 text-sm;
	}

	.wiki-content {
		@apply text-muted-foreground;
	}
</style>
