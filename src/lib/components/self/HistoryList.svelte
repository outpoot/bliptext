<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Card } from "$lib/components/ui/card";
	import {
		Avatar,
		AvatarImage,
		AvatarFallback,
	} from "$lib/components/ui/avatar";
	import { getWordAtIndex } from "$lib/utils";
	import { fade } from "svelte/transition";
	import Gavel from "lucide-svelte/icons/gavel";
	import { currentUser } from "$lib/stores/user";
	import { styles } from "$lib/utils/styles";
	import type { RevisionWithUser } from "$lib/utils/revision";
	import { Badge } from "../ui/badge";

	export let revisions: RevisionWithUser[];
	export let loading = false;
	export let hasMore = false;
	export let onLoadMore: () => void;
	export let onBanUser: (userId: string) => void;
	export let showBanButton = true;

	let container: HTMLElement;

	function formatDate(date: string) {
		return new Date(date).toLocaleString();
	}

	function handleScroll() {
		if (!container) return;

		const bottom =
			container.scrollHeight -
			container.scrollTop -
			container.clientHeight;
		if (bottom < 100) {
			onLoadMore();
		}
	}
</script>

<div
	class="max-h-[calc(100vh-8rem)] space-y-3 overflow-y-auto pr-2 sm:space-y-4 sm:pr-4"
	bind:this={container}
	on:scroll={handleScroll}
>
	{#each revisions as revision (revision.id)}
		<div transition:fade>
			<Card class="p-3 sm:p-4">
				<div class="flex items-start gap-3 sm:gap-4">
					<Avatar class="h-8 w-8 sm:h-10 sm:w-10">
						<AvatarImage
							src={revision.user.image}
							alt={revision.user.name}
						/>
						<AvatarFallback>{revision.user.name[0]}</AvatarFallback>
					</Avatar>
					<div class="min-w-0 flex-1">
						<div
							class="mb-1 flex flex-col gap-1 sm:mb-2 sm:flex-row sm:items-baseline sm:justify-between"
						>
							<span class="truncate font-medium"
								>{revision.user.name}</span
							>
							<span
								class="text-xs text-muted-foreground sm:text-sm"
							>
								{formatDate(revision.createdAt)}
							</span>
						</div>
						<div class="rounded-lg bg-muted p-2 sm:p-3">
							<p class="mb-2 text-xs sm:text-sm">
								Changed word at position {revision.wordIndex +
									1}:
							</p>
							<div
								class="flex flex-wrap items-center gap-2 font-mono text-xs sm:text-sm"
							>
								<span class="text-destructive line-through"
									>{revision.wordChanged}</span
								>
								<span class="text-muted-foreground">→</span>
								<span class="break-all text-primary"
									>{getWordAtIndex(
										revision.newWord,
										revision.wordIndex,
									)}</span
								>
							</div>
						</div>
					</div>
					{#if $currentUser?.isAdmin && !revision.user.isBanned && showBanButton}
						<Button
							variant="destructive"
							size="sm"
							class="flex items-center gap-2 group"
							onclick={() => onBanUser(revision.user.id)}
							disabled={revision.user.id === $currentUser?.id}
						>
							<Gavel class={styles.iconClass} />
							Ban
						</Button>
					{/if}
					{#if revision.user.isBanned}
						<Badge variant="destructive">Banned</Badge>
					{/if}
				</div>
			</Card>
		</div>
	{/each}

	{#if loading}
		<div class="py-4 text-center">
			<span class="text-sm text-muted-foreground">Loading more...</span>
		</div>
	{/if}

	{#if !hasMore && revisions.length > 0}
		<div class="py-4 text-center">
			<span class="text-sm text-muted-foreground">No more revisions</span>
		</div>
	{/if}

	{#if revisions.length === 0 && !loading}
		<Card class="p-4">
			<p class="text-center text-sm text-muted-foreground">
				No revisions found
			</p>
		</Card>
	{/if}
</div>
