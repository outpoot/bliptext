<script lang="ts">
	import { getAstNode } from "svelte-exmarkdown";
	import { transformWikiImageUrl } from "$lib/utils/imageUtils";

	const astContext = getAstNode();
	const node = $astContext;

	const rawContent =
		(node?.children?.map((child) => child.value ?? "") ?? [])
			.join("")
			.trim() || "";

	let _content = rawContent;

	if (_content.startsWith("#")) _content = _content.slice(1).trim();
	if (_content.endsWith("]")) _content = _content.slice(0, -1).trim();
	if (_content.startsWith("[")) _content = _content.slice(1).trim();

	const parts = _content.split("|").map((s) => s.trim());
	const isWikiBox = parts.length >= 2 && parts.length <= 3;

	let title = $state("");
	let imageUrl = "";
	let content = $state("");
	let imageUrls: { primary: string; fallback: string | null } | null = null;
	let currentSrc = $state("");

	$effect(() => {
		if (isWikiBox) {
			[title, imageUrl, content = ""] = parts;

			if (imageUrl) {
				transformWikiImageUrl(imageUrl).then((urls) => {
					imageUrls = urls;
					currentSrc = urls.primary;
				});
			}
		}
	});

	const handleError = (ev: Event) => {
		if (imageUrls?.fallback) {
			currentSrc = imageUrls.fallback;
		}
	};
</script>

{#if isWikiBox}
	<figure class="wiki-image-box">
		{#if currentSrc}
			<img src={currentSrc} alt={title} onerror={handleError} />
		{/if}
		<figcaption>
			{#if title}
				<strong>{title}</strong>
			{/if}
			<div class="wiki-content">{content}</div>
		</figcaption>
	</figure>
{:else}
	<h1 class="mb-4 mt-6 text-4xl font-bold">{rawContent}</h1>
{/if}

<style>
	.wiki-image-box {
		@apply float-right clear-right mb-6 ml-4 max-w-[250px] overflow-hidden 
		rounded-lg border bg-card;
	}

	figcaption {
		@apply border-t bg-muted/50 p-3 text-sm;
	}

	.wiki-content {
		@apply text-muted-foreground;
	}
</style>
