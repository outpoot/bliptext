<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';

	import Search from 'lucide-svelte/icons/search';
	import Sparkles from 'lucide-svelte/icons/sparkles';

	import TooltipButton from './TooltipButton.svelte';

	let searchQuery = $state('');

	let { class: className = '', includeRandom = false, onNavigate = () => {} } = $props();

	async function handleSearch(e: Event) {
		e.preventDefault();
		if (searchQuery.trim()) {
			await goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
			onNavigate();
		}
	}

	async function handleRandom() {
		try {
			const res = await fetch('/api/random');
			if (!res.ok) throw new Error('Failed to fetch random article');
			const { slug } = await res.json();
			await goto(`/articles/${slug}`);
			onNavigate();
		} catch (error) {
			console.error('Error navigating to random article:', error);
		}
	}
</script>

<form
	class="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 {className}"
	onsubmit={handleSearch}
>
	<div
		class="relative flex flex-1 [&:has(input:focus-visible)>button]:ring-1 [&:has(input:focus-visible)>button]:ring-ring"
	>
		<Input
			type="search"
			placeholder="Dogs..."
			class="h-10 w-full rounded-r-none bg-primary-foreground"
			bind:value={searchQuery}
		/>
		<Button type="submit" variant="outline" class="h-10 rounded-l-none border-l-0">
			<Search class="h-4 w-4" />
		</Button>
	</div>

	{#if includeRandom}
		<div class="h-10">
			<TooltipButton
				icon={Sparkles}
				tooltipText="View random article"
				buttonClass="h-10 w-12"
				onClick={handleRandom}
			/>
		</div>
	{/if}
</form>
