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

	const astContext = getAstNode();
	const node = $astContext as AstNode;

	let { children } = $props();

	let imageDetails = $state<ImageDetails | null>(null);
	let infoItems = $state<InfoItem[]>([]);

	let isSummary = $derived(
		node?.type === 'element' &&
			node?.tagName === 'p' &&
			node?.children?.[0]?.type === 'text' &&
			node?.children?.[0]?.value?.startsWith(':::summary')
	);

	$effect(() => {
		if (!isSummary || !node.children) return;

		// find the image node
		const imageNode = node.children.find(
			(child) => child.type === 'element' && child.tagName === 'img'
		);

		// set image shit
		if (imageNode?.properties?.src) {
			imageDetails = {
				src: imageNode.properties.src.startsWith('http')
					? imageNode.properties.src
					: 'https://' + imageNode.properties.src,
				alt: imageNode.properties.alt || ''
			};
		}

		// needles
		let currentLabel = '';
		let currentContent: InfoItem['content'] = [];
		let items: InfoItem[] = [];

		// loop thru haystack
		node.children.forEach((child) => {
			// extract bold elements & push them
			if (child.type === 'element' && child.tagName === 'strong' && child.children?.[0]) {
				if (currentLabel) {
					items.push({ label: currentLabel, content: currentContent });
				}
				currentLabel = child.children[0].value || '';
				currentContent = [];
			} // extract hyperlinks & push them
			else if (child.type === 'element' && child.tagName === 'a') {
				const linkText = child.children?.[0]?.value || '';
				const href = child.properties?.href || '';
				currentContent.push({ type: 'link', value: linkText, href });
			} // EOF
			else if (
				child.type === 'text' &&
				child.value &&
				!child.value.includes(':::summary') &&
				!child.value.includes(':::')
			) {
				currentContent.push({ type: 'text', value: child.value });
			}
		});

		if (currentLabel) {
			items.push({ label: currentLabel, content: currentContent });
		}

		infoItems = items;
	});
</script>

{#if isSummary}
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
