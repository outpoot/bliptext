<script lang="ts">
	/**
This renders:

:::summary
![Tyler, the Creator at Primavera Sound 2022](i.imgur.com/R9nRfZN.png)

**Name:** Tyler Gregory Okonma
**Born:** March 6, 1991 (age 33), Hawthorne, California, U.S.  
**Other Names:** Tyler Haley · Wolf Haley · Bunnyhop · Golf/Mono/ Ace  
**Occupations:** Rapper · singer · songwriter · record producer · director · fashion designer · actor  
**Years Active:** 2007–present  
**Works:** Discography · production songs  
**Genres:** Alternative hip hop · neo soul · jazz rap · hardcore hip hop · R&B  
**Instruments:** Vocals · piano  
**Labels:** Columbia · Odd Future · Sony  
**Website:** [golfwang.com](https://golfwang.com) · [golflefleur.com](https://golflefleur.com)
:::
 */

	import { getAstNode } from 'svelte-exmarkdown';
	import { Card, CardContent } from '$lib/components/ui/card';

	interface ImageDetails {
		src: string;
		alt: string;
	}

	interface InfoItem {
		label: string;
		content: {
			type: 'text' | 'link';
			value: string;
			href?: string;
		}[];
	}

	interface AstNode {
		type: string;
		tagName?: string;
		children?: Array<{
			type: string;
			tagName?: string;
			value?: string;
			children?: Array<{ value: string }>;
			properties?: {
				src?: string;
				alt?: string;
				href?: string;
			};
		}>;
	}

	function decodeWikiUrl(url: string) {
		if (!url) return url;
		return url.replace(/\/\/\//g, '_');
	}

	const astContext = getAstNode();
	const node = $astContext as AstNode;

	let { children } = $props();

	let imageDetails = $state<ImageDetails | null>(null);
	let infoItems = $state<InfoItem[]>([]);

	const isSummary = $derived(
		node?.type === 'element' &&
			node?.tagName === 'p' &&
			(node.children || [])
				.filter((c) => c.type === 'text')
				.map((c) => c.value || '')
				.join('')
				.trim()
				.startsWith(':::summary')
	);

	const hasContent = $derived(!!imageDetails || infoItems.length > 0);

	$effect(() => {
		if (!isSummary || !node.children) return;

		// find the image node
		const imageNode = node.children.find(
			(child) => child.type === 'element' && child.tagName === 'img'
		);

		// set image shit
		if (imageNode?.properties?.src) {
			const decodedSrc = decodeWikiUrl(imageNode.properties.src);
			imageDetails = {
				src: decodedSrc.startsWith('http') ? decodedSrc : 'https://' + decodedSrc,
				alt: imageNode.properties.alt || ''
			};
		}

		// needles
		let currentLabel = '';
		let currentContent: InfoItem['content'] = [];
		let items: InfoItem[] = [];
		let isCollecting = false;

		node.children.forEach((child) => {
			if (child.type === 'element' && child.tagName === 'strong' && child.children?.[0]) {
				if (currentLabel) {
					items.push({ label: currentLabel, content: currentContent });
				}
				currentLabel = child.children[0].value || '';
				currentContent = [];
				isCollecting = true;
			} else if (child.type === 'text' && child.value && isCollecting) {
				const closingIdx = child.value.indexOf(':::');
				if (closingIdx !== -1) {
					const value = child.value.slice(0, closingIdx).trim();
					if (value) {
						currentContent.push({ type: 'text', value });
					}
					isCollecting = false; // Stop collecting after closing
				} else {
					const trimmed = child.value.trim();
					if (trimmed) {
						currentContent.push({ type: 'text', value: trimmed });
					}
				}
			}
		});

		if (currentLabel) {
			items.push({ label: currentLabel, content: currentContent });
		}

		infoItems = items;
	});
</script>

{#if isSummary}
	{#if hasContent}
		<Card
			class="float-right clear-right mb-6 ml-4 max-w-sm overflow-hidden rounded-lg border bg-card"
		>
			{#if imageDetails}
				<img src={imageDetails.src} alt={imageDetails.alt} class="summary-image" />
			{/if}
			<CardContent class="space-y-2 p-4">
				{#each infoItems as { label, content }}
					<div class="flex gap-2">
						<span class="min-w-24 font-bold">{label}</span>
						<span class="flex-1">
							{#each content as part}
								{#if part.type === 'link'}
									<a href={part.href} class="text-primary hover:underline">{part.value}</a>
								{:else}
									{part.value}
								{/if}
							{/each}
						</span>
					</div>
				{/each}
			</CardContent>
		</Card>
	{/if}
{:else}
	<p>
		{@render children?.()}
	</p>
{/if}

<style>
	.summary-box {
		@apply mb-6 ml-4 max-w-[250px] overflow-hidden rounded-lg border bg-card;
	}

	.summary-image {
		@apply w-full object-contain;
		@apply max-h-[400px];
	}
</style>
