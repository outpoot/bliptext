<script lang="ts">
	import { getAstNode } from 'svelte-exmarkdown';

	const astContext = getAstNode();
	const node = $astContext;
	const rawContent = node?.children?.[0]?.value ?? '';

	// Parse bracket content
	const bracketContent = rawContent.match(/\[(.*)\]/)?.[1] ?? '';
	const parts = bracketContent.split('|').map((s) => s.trim());
	const isWikiBox = parts.length >= 2 && parts.length <= 3;

	let title = '';
	let imageUrl = '';
	let content = '';

	if (isWikiBox) {
		[title, imageUrl, content] = parts.length === 2 ? ['', ...parts] : parts;

		if (imageUrl) {
			imageUrl = !imageUrl.startsWith('https://') ? `https://${imageUrl}` : imageUrl;
			imageUrl = imageUrl.includes('imgur.com') ? imageUrl : '';
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
		@apply float-right clear-right mb-6 ml-6 max-w-sm overflow-hidden rounded-lg border bg-card;
	}

	figcaption {
		@apply border-t bg-muted/50 p-3 text-sm;
	}

	.wiki-content {
		@apply text-muted-foreground;
	}
</style>
