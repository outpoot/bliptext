<script lang="ts">
	import Separator from '../ui/separator/separator.svelte';
	import { Button } from '$lib/components/ui/button';

	import Pen from 'lucide-svelte/icons/pen';
	import History from 'lucide-svelte/icons/history';
	import Link from 'lucide-svelte/icons/link';
	import Download from 'lucide-svelte/icons/download';
	import Info from 'lucide-svelte/icons/info';

	let { slug, content, title } = $props<{ slug: string; content: string; title: string }>();
	let isCollapsed = $state(false);

	function downloadMarkdown() {
		const header = `<!--
        This is an informative header that provides metadata about the article. It will not get rendered when the markdown file is viewed in a markdown viewer.
        
        Article: ${slug}
        Downloaded from Bliptext (https://bliptext.com)
        Date: ${new Date().toISOString()}
        
        This file is provided by Bliptext, a free and open source knowledge base, where everybody can edit 1 word per 5 minutes.
        
        Visit us at https://bliptext.com
-->\n\n# ${title}\n\n`;

		const blob = new Blob([header + content], { type: 'text/markdown' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${slug}.md`;
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
	}

	const tools = [
		{ icon: Pen, text: 'Edit', href: `${slug}/edit` },
		{ icon: History, text: 'History', href: `${slug}/history` },
		{
			icon: Link,
			text: 'Copy link',
			action: () => {
				navigator.clipboard.writeText(window.location.href);
			}
		},
		{ icon: Download, text: 'Download', action: downloadMarkdown },
		{ icon: Info, text: 'Page information', href: `${slug}/info` }
	];
</script>

<div class="sticky top-4">
	<div class="mb-2 flex items-center justify-between">
		<h2 class="text-lg font-bold">Tools</h2>
		<Button variant="ghost" size="icon" onclick={() => (isCollapsed = !isCollapsed)}>
			{isCollapsed ? '+' : '-'}
		</Button>
	</div>

	<Separator class="mb-2" />

	<div class="space-y-1 overflow-hidden text-sm {isCollapsed ? 'h-0' : ''}">
		{#each tools as { icon: Icon, text, href, action }}
			{#if href}
				<Button variant="ghost" class="w-full justify-start" {href}>
					<Icon class="mr-2 h-4 w-4" />
					{text}
				</Button>
			{:else}
				<Button variant="ghost" class="w-full justify-start" onclick={action}>
					<Icon class="mr-2 h-4 w-4" />
					{text}
				</Button>
			{/if}
		{/each}
	</div>
</div>
