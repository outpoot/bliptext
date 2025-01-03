<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Search, Sparkles } from 'lucide-svelte';
	import TooltipButton from './TooltipButton.svelte';

	let searchQuery = $state('');

	function handleSearch(e: Event) {
		e.preventDefault();
		if (searchQuery.trim()) {
			goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	}

	let { class: className = '', includeRandom = false } = $props();
</script>

<form class={`flex items-center gap-3 ${className}`} onsubmit={handleSearch}>
	<div
		class="relative flex flex-1 [&:has(input:focus-visible)>button]:ring-1 [&:has(input:focus-visible)>button]:ring-ring"
	>
		<Input
			type="search"
			placeholder="Dogs..."
			class="h-10 w-full rounded-r-none"
			bind:value={searchQuery}
		/>
		<Button type="submit" variant="outline" class="h-10 rounded-l-none border-l-0">
			<Search class="h-4 w-4" />
		</Button>
	</div>

	{#if includeRandom}
		<div class="h-10">
			<TooltipButton icon={Sparkles} tooltipText="View random article" buttonClass="h-10 w-12" />
		</div>
	{/if}
</form>
