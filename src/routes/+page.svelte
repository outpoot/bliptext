<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	import { Search } from 'lucide-svelte';
</script>

<div class="flex h-screen flex-col items-center gap-4 pt-24">
	<div class="flex flex-col items-center gap-2">
		<Label class="text-6xl">Bliptext</Label>
		<Label class="text-lg"
			>A wiki where you can edit <span class="text-primary">one word</span> every 5 minutes.</Label
		>
	</div>

	<img src="/images/logo.svg" alt="Bliptext logo" class="w-48" />

	<!-- tricky way to get the icon button inside -->
	<div class="w-full max-w-md px-4">
		<div
			class="relative flex [&:has(input:focus-visible)>button]:ring-1 [&:has(input:focus-visible)>button]:ring-ring"
		>
			<Input type="search" placeholder="Dogs..." class="w-full rounded-r-none" />
			<button
				class="flex items-center rounded-r-md border border-l-0 border-input bg-input px-3 transition-colors hover:bg-accent"
			>
				<Search class="h-4 w-4 text-muted-foreground" />
			</button>
		</div>
	</div>
</div>
