<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import Separator from '../ui/separator/separator.svelte';
	import { Input } from '../ui/input';

	let { content, title, wordInput, inputProps } = $props<{
		content: string;
		title: string;
		wordInput: boolean;
		inputProps?: any;
	}>();
	let isCollapsed = $state(false);

	let items = $state<{ id: string; level: number; text: string }[]>([]);

	let activeId = $state('');

	let observer: IntersectionObserver;

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

					if (text === '') return null;

					const id = `section-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
					return { id, level, text };
				})
				.filter((item: { id: string; level: number; text: string } | null) => item !== null)
		];

		const headers = Array.from(
			document.querySelectorAll(
				'.markdown-content h1, .markdown-content h2, .markdown-content h3, .markdown-content h4, .markdown-content h5, .markdown-content h6, #title'
			)
		);

		// Add IDs to actual header elements after render
		setTimeout(() => {
			headers.forEach((el) => {
				const headerText = el.textContent?.replace(/\[.*?\]/g, '').trim() ?? '';

				const matchingItem = items.find((item) =>
					headerText.toLowerCase().includes(item.text.toLowerCase())
				);

				if (matchingItem) {
					el.id = matchingItem.id;
				}
			});

			// Handle initial hash scroll
			if (page.url.hash) {
				scrollTo(page.url.hash.slice(1));
			}
		}, 100);

		// Set up intersection observer after headers are ready
		setTimeout(() => {
			observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							activeId = entry.target.id;
						}
					});
				},
				{
					rootMargin: '0% 0px -90% 0px' // Consider element "visible"
				}
			);

			headers.forEach((header) => {
				observer.observe(header);
			});
		}, 100);
	});

	onDestroy(() => {
		if (observer) {
			observer.disconnect();
		}
	});

	function scrollTo(id: string) {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth' });
			history.pushState(null, '', `#${id}`);
		}
	}
</script>

<div class="sticky top-4">
	<div class="mb-2 flex items-center justify-between">
		<h2 class="text-lg font-bold">Contents</h2>
		<button class="rounded-lg p-1.5 hover:bg-accent" onclick={() => (isCollapsed = !isCollapsed)}>
			{isCollapsed ? '+' : '-'}
		</button>
	</div>

	<Separator class="mb-2" />

	<div
		class="space-y-1 overflow-hidden text-sm {isCollapsed
			? 'h-0'
			: 'max-h-[calc(100vh-10rem)] overflow-y-auto'}"
	>
		{#each items as { id, level, text }}
			<button
				class="block w-full truncate text-left hover:text-primary
                    {level > 1 ? 'pl-' + level * 4 : ''} 
                    {activeId === id ? 'font-semibold text-primary' : 'text-muted-foreground'}"
				onclick={() => scrollTo(id)}
			>
				{text}
			</button>
		{/each}
	</div>

	<Separator class="mb-2 mt-2" />

	{#if wordInput}
		<Input
			{...inputProps}
			placeholder="Type a single word to edit..."
			class="mt-4 border-2 border-primary p-6 text-lg"
		/>
	{/if}
</div>
