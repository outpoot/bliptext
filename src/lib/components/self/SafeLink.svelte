<script lang="ts">
	import { getAstNode } from 'svelte-exmarkdown';

	const astContext = getAstNode();
	const node = $astContext;

	const href = node?.properties?.href?.toString() ?? '';
	const rawContent = node?.children?.[0]?.value ?? '';

	const isValidUrl = (url: string): boolean => {
		try {
			const parsed = new URL(url);
			return parsed.protocol === 'http:' || parsed.protocol === 'https:';
		} catch {
			return false;
		}
	};

	const safeHref = isValidUrl(href) ? href : null;
</script>

{#if safeHref}
	<a href={safeHref} target="_blank" rel="noopener noreferrer nofollow" aria-label="Provided link"
		>{rawContent}</a
	>
{:else}
	<span>
		{rawContent}
	</span>
{/if}
