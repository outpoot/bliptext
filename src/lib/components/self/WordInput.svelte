<script lang="ts">
	import { Input } from "../ui/input";
	import { cooldown } from "$lib/stores/cooldown";

	let { inputProps = {}, class: className = "" } = $props();

	let err = $state("");

	function validateInput(event: Event) {
		const input = event.target as HTMLInputElement;
		const value = input.value;

		if (
			value &&
			!/^(\*\*\w+\*\*|\*\w+\*|\[\w+\]\([^\s]{1,50}\)|\w+)$/.test(value)
		) {
			err =
				"Please enter a single word, optionally formatted with *word*, **word**, or [word](url)";
		} else {
			err = "";
		}
	}
</script>

<div class="relative {className} bg-primary-foreground">
	<Input
		{...inputProps}
		placeholder="Type a word"
		class="border-2 border-primary p-6 text-lg"
		on:input={validateInput}
		disabled={$cooldown.isActive}
	/>
	{#if $cooldown.isActive}
		<div
			class="absolute inset-0 flex items-center justify-center"
			role="status"
			aria-live="polite"
		>
			<span class="text-md text-muted-foreground md:text-sm">
				Wait {$cooldown.remainingTime}s
			</span>
		</div>
	{/if}
	{#if err}
		<p class="text-red-500" role="alert">{err}</p>
	{/if}
</div>
