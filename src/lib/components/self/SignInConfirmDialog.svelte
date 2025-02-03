<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';

	export let open = false;
	export let onConfirm: () => void;

	function handleConfirm() {
		onConfirm();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Terms of Service Agreement</Dialog.Title>
			<Dialog.Description>
				By continuing to sign in, you agree to our Terms of Service and Privacy Policy.
			</Dialog.Description>
		</Dialog.Header>

		<div class="mt-4 space-y-4">
			<p class="text-sm text-muted-foreground">
				Our platform involves collaborative content editing. Please review our
				<a href="/legal/terms" class="font-medium text-primary hover:underline" target="_blank"
					>Terms of Service</a
				>
				and
				<a href="/legal/privacy" class="font-medium text-primary hover:underline" target="_blank"
					>Privacy Policy</a
				>
				before continuing.
			</p>
		</div>

		<div class="mt-6 flex justify-end gap-3">
			<Dialog.Close>Cancel</Dialog.Close>
			<Button
				variant="default"
				onclick={handleConfirm}
			>
				I Agree
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
