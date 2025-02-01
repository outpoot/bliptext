<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import ArrowLeft from 'lucide-svelte/icons/arrow-left';
	import { getWordAtIndex } from '$lib/utils';
	import { fade } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import Gavel from 'lucide-svelte/icons/gavel';
	import { page } from '$app/state';

	import { currentUser } from '$lib/stores/user';
	import { styles } from '$lib/utils/styles';

	interface RevisionWithUser {
		id: string;
		wordChanged: string;
		newWord: string;
		wordIndex: number;
		createdAt: string;
		user: {
			id: string;
			name: string;
			image: string;
			isBanned?: boolean;
		};
	}

	let { data } = $props<{
		data: {
			article: { id: string; slug: string; title: string; content: string };
			history: RevisionWithUser[];
			hasMore: boolean;
			nextCursor: string | null;
		};
	}>();

	let loading = $state(false);
	let revisions = $state(data.history);
	let hasMore = $state(data.hasMore);
	let nextCursor = $state(data.nextCursor);

	let container: HTMLElement;

	function formatDate(date: string) {
		return new Date(date).toLocaleString();
	}

	async function loadMore() {
		if (!hasMore || loading) return;

		loading = true;

		try {
			const res = await fetch(`/api/articles/${data.article.slug}/history?cursor=${nextCursor}`);
			if (!res.ok) {
				throw new Error('Failed to load history');
			}

			const newData = await res.json();
			if (!newData?.history) {
				throw new Error('Invalid response data');
			}

			revisions = [...revisions, ...newData.history];

			hasMore = newData.hasMore;
			nextCursor = newData.nextCursor;
		} catch (err) {
			console.error('Failed to load more:', err);
			toast.error('Failed to load article history');

			hasMore = false;
		} finally {
			loading = false;
		}
	}

	async function banUser(userId: string) {
		if (userId === $currentUser?.id) {
			toast.error('You cannot ban yourself');
			return;
		}

		try {
			const res = await fetch(`/api/admin/bans`, {
				method: 'POST',
				body: JSON.stringify({ userId })
			});

			if (!res.ok) throw new Error();

			toast.success('User banned successfully');
			revisions = revisions.map((rev: { user: { id: string; isBanned: any } }) => ({
				...rev,
				user: {
					...rev.user,
					isBanned: rev.user.id === userId ? true : rev.user.isBanned
				}
			}));
		} catch {
			toast.error('Failed to ban user');
		}
	}

	function handleScroll() {
		if (!container) return;

		const bottom = container.scrollHeight - container.scrollTop - container.clientHeight;
		if (bottom < 100) {
			loadMore();
		}
	}
</script>

<svelte:head>
	<title>{'History: ' + data.article.title}</title>
	<meta name="description" content="View the revisions for this article on Bliptext!" />
	<meta name="keywords" content="article, edit, markdown, wikipedia, wiki" />
	<meta property="og:title" content={data.article.title} />
	<meta
		property="og:description"
		content="View the revisions for this article on Bliptext!"
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content={page.url.href} />
</svelte:head>

<div class="container mx-auto px-4 py-4 sm:py-8">
	<div class="mb-4 sm:mb-8">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
			<Button variant="ghost" href="./" class="w-fit p-2">
				<ArrowLeft class="h-5 w-5" />
			</Button>
			<div>
				<h1 class="text-2xl font-bold sm:text-3xl">History</h1>
				<p class="text-sm text-muted-foreground sm:text-base">
					for article: {data.article.title}
				</p>
			</div>
		</div>
	</div>

	<div
		class="max-h-[calc(100vh-8rem)] space-y-3 overflow-y-auto pr-2 sm:space-y-4 sm:pr-4"
		bind:this={container}
		onscroll={handleScroll}
	>
		{#each revisions as revision (revision.id)}
			<div transition:fade>
				<Card class="p-3 sm:p-4">
					<div class="flex items-start gap-3 sm:gap-4">
						<Avatar class="h-8 w-8 sm:h-10 sm:w-10">
							<AvatarImage src={revision.user.image} alt={revision.user.name} />
							<AvatarFallback>{revision.user.name[0]}</AvatarFallback>
						</Avatar>
						<div class="min-w-0 flex-1">
							<div
								class="mb-1 flex flex-col gap-1 sm:mb-2 sm:flex-row sm:items-baseline sm:justify-between"
							>
								<span class="truncate font-medium">{revision.user.name}</span>
								<span class="text-xs text-muted-foreground sm:text-sm">
									{formatDate(revision.createdAt)}
								</span>
							</div>
							<div class="rounded-lg bg-muted p-2 sm:p-3">
								<p class="mb-2 text-xs sm:text-sm">
									Changed word at position {revision.wordIndex + 1}:
								</p>
								<div class="flex flex-wrap items-center gap-2 font-mono text-xs sm:text-sm">
									<span class="text-destructive line-through">{revision.wordChanged}</span>
									<span class="text-muted-foreground">→</span>
									<span class="break-all text-primary"
										>{getWordAtIndex(revision.newWord, revision.wordIndex)}</span
									>
								</div>
							</div>
						</div>
						{#if $currentUser?.isAdmin && !revision.user.isBanned}
							<Button
								variant="destructive"
								size="sm"
								class="group"
								onclick={() => banUser(revision.user.id)}
								disabled={revision.user.id === $currentUser?.id}
							>
								<Gavel class={`${styles.iconClass} mr-0`} />
								Ban
							</Button>
						{/if}
						{#if revision.user.isBanned}
							<span class="text-xs text-destructive">Banned</span>
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
				<p class="text-center text-sm text-muted-foreground">No revisions found</p>
			</Card>
		{/if}
	</div>
</div>
