<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	let { content, title } = $props<{ content: string; title: string }>();

	let items = $state<{ id: string; level: number; text: string }[]>([]);
	let headingElements = $state<HTMLElement[]>([]);

    // TODO: would probably wanna use the AST given by svelte-exmarkdown instead of parsing the content manually

	onMount(() => {
		items = [
			{ id: 'title', level: 1, text: title },
			...content
				.split('\n')
				.filter((line: string) => line.startsWith('#'))
				.map((line: string) => {
					const match = line.match(/^#+/);
					const level = match?.[0].length ?? 1;
					// Remove markdown wiki box syntax and other formatting
					const text = line
						.replace(/^#+\s*/, '')
						.replace(/\[.*?\]/g, '')
						.trim();
					const id = `section-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
					return { id, level, text };
				})
		];

		// Add IDs to actual header elements after render
		setTimeout(() => {
			headingElements = Array.from(
				document.querySelectorAll('.markdown-content h1, .markdown-content h2')
			);
			headingElements.forEach((el, index) => {
				if (items[index]) {
					el.id = items[index].id;
				}
			});

			// Scroll to hash if present
			if (page.url.hash) {
				document.querySelector(page.url.hash)?.scrollIntoView({ behavior: 'smooth' });
			}
		}, 100);
	});

	function scrollTo(id: string) {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth' });
			history.pushState(null, '', `#${id}`);
		}
	}
</script>

<nav class="sticky top-8 w-64 space-y-1 text-sm">
	{#each items as { id, level, text }}
		<button
			class="block w-full truncate text-left hover:text-primary
				{level > 1 ? 'pl-' + level * 4 : ''} 
				{page.url.hash === '#' + id ? 'text-primary' : 'text-muted-foreground'}"
			onclick={() => scrollTo(id)}
		>
			{text}
		</button>
	{/each}
</nav>
