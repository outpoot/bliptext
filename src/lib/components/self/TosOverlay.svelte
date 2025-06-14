<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { tosAccepted } from "$lib/stores/tosAccepted";

	interface Props {
		open?: boolean;
	}

	let { open = $bindable(true) }: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Beware!</Dialog.Title>
			<Dialog.Description>
				Please read and accept our terms before editing articles.
			</Dialog.Description>
		</Dialog.Header>

		<div class="max-h-[400px] space-y-4 overflow-y-auto">
			<p class="mb-4 font-bold text-destructive">
				Failure to follow these rules will result in an immediate ban.
			</p>

			<h3 class="font-semibold">Basic Rules</h3>
			<ul class="list-disc space-y-2 pl-5">
				<li>No NSFW content or inappropriate material</li>
				<li>Don't submit links to suspicious or harmful websites</li>
				<li>Keep content reasonable - use common sense</li>
				<li>Avoid hate speech or targeted harassment</li>
				<li>Avoid usage of slurs</li>
			</ul>

			<h3 class="font-semibold">Guidelines</h3>
			<ul class="list-disc space-y-2 pl-5">
				<li>Keep edits somewhat coherent and readable</li>
				<li>Be creative but avoid truly offensive content</li>
			</ul>
		</div>

		<p class="text-sm text-muted-foreground">
			<a href="/legal/terms" class="underline hover:text-primary"
				>Read more in our Terms of Service</a
			>
		</p>

		<div class="flex justify-end gap-3">
			<Button
				variant="default"
				onclick={() => {
					$tosAccepted = true;
					open = false;
				}}
			>
				I Accept Terms & Rules
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
