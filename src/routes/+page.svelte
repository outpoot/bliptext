<script lang="ts">
	import LogoBlink from '$lib/components/self/LogoBlink.svelte';
	import TooltipButton from '$lib/components/self/TooltipButton.svelte';
    
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Search, Sparkles } from 'lucide-svelte';
</script>

<div class="flex h-screen flex-col items-center gap-4 pt-24">
	<div class="flex flex-col items-center gap-2">
		<Label class="text-6xl">Bliptext</Label>
		<Label class="text-lg"
			>A wiki where you can edit <span class="text-primary">one word</span> every 5 minutes.</Label
		>
	</div>

	<LogoBlink />

	<div class="w-full max-w-md px-4">
		<div class="flex gap-2">
			<div
				class="relative flex flex-1 [&:has(input:focus-visible)>button]:ring-1 [&:has(input:focus-visible)>button]:ring-ring"
			>
				<Input type="search" placeholder="Dogs..." class="w-full rounded-r-none" />

				<TooltipButton
					icon={Search}
					tooltipText="Search for articles in the wiki"
					buttonClass="rounded-l-none border-l-0"
				/>
			</div>
			<TooltipButton
				icon={Sparkles}
				tooltipText="View random article"
			/>
		</div>
	</div>
</div>
