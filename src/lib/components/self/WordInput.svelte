<script lang="ts">
	import { Input } from "../ui/input";
	import { cooldown } from "$lib/stores/cooldown";
	import * as Card from "$lib/components/ui/card";
	import { Separator } from "../ui/separator";
	import { MAX_WORD_LENGTH } from "$lib/shared/wordMatching";

	let { inputProps = {}, class: className = "" } = $props();

	let err = $state("");

	async function fetchValidateWord(word: string) {
		try {
			const response = await fetch("/api/validate-word", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ word }),
			});
			return response.status === 200;
		} catch (error) {
			return false;
		}
	}

	async function validateInput(event: Event) {
		const input = event.target as HTMLInputElement;
		let value = input.value;

		if (!value) {
			err = "";
			return;
		}

		if (value.length > MAX_WORD_LENGTH) {
			value = value.slice(0, MAX_WORD_LENGTH);
			input.value = value;
			err = `Word truncated to ${MAX_WORD_LENGTH} characters`;
			return;
		}

		const isValid = await fetchValidateWord(value);
		if (!isValid) {
			err =
				"Word can be:\n• Plain text (optional . or , at end)\n• *italic*\n• **bold**\n• [text](url)";
		} else {
			err = "";
		}
	}
</script>

<Card.Root class="relative {className}">
	<Card.Content class="p-0">
		<Input
			{...inputProps}
			placeholder="Type a word"
			class="border-0 bg-transparent p-6 text-lg shadow-none focus-visible:ring-0 {$cooldown.isActive
				? 'blur-[2px]'
				: ''}"
			on:input={validateInput}
			disabled={$cooldown.isActive}
		/>
		{#if $cooldown.isActive}
			<div
				class="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px]"
				role="status"
				aria-live="polite"
			>
				<span class="text-sm font-medium"
					>Wait {$cooldown.remainingTime}s</span
				>
			</div>
		{/if}
		{#if err}
			<Separator class="mb-2" />
			<div class="px-6 pb-4">
				<p
					class="whitespace-pre-line text-sm text-destructive"
					role="alert"
				>
					{err}
				</p>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
