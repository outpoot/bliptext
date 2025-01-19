<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';

	let { icon, tooltipText, buttonClass = '', variant = 'outline' as const } = $props<{
		icon: any;
		tooltipText: string;
		buttonClass?: string;
		variant?: 'outline' | 'link' | 'default' | 'destructive' | 'secondary' | 'ghost';
	}>();
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger class={buttonClass}>
			<Button {variant}>
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
