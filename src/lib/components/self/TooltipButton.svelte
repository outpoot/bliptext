<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';

	let { icon, tooltipText, buttonClass = '', variant = 'outline' } = $props();
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger>
			<Button {variant} class={buttonClass}>
				<!-- svelte5 fuck sake -->
				{@const Icon = icon}
				<Icon class="h-4 w-4" />
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p class="text-sm">{tooltipText}</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>
