<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import ArrowLeft from "lucide-svelte/icons/arrow-left";
	import { toast } from "svelte-sonner";
	import { page } from "$app/state";
	import HistoryList from "$lib/components/self/HistoryList.svelte";
	import type { RevisionWithUser } from "$lib/utils/revision";

	let { data } = $props<{
		data: {
			article: {
				id: string;
				slug: string;
				title: string;
				content: string;
			};
			history: RevisionWithUser[];
			hasMore: boolean;
			nextCursor: string | null;
		};
	}>();

	let loading = $state(false);
	let revisions = $state(data.history);
	let hasMore = $state(data.hasMore);
	let nextCursor = $state(data.nextCursor);

	async function loadMore() {
		if (!hasMore || loading) return;
		loading = true;

		try {
			const res = await fetch(
				`/api/articles/${data.article.slug}/history?cursor=${nextCursor}`,
			);
			if (!res.ok) throw new Error("Failed to load history");

			const newData = await res.json();
			if (!newData?.history) throw new Error("Invalid response data");

			revisions = [...revisions, ...newData.history];
			hasMore = newData.hasMore;
			nextCursor = newData.nextCursor;
		} catch (err) {
			console.error("Failed to load more:", err);
			toast.error("Failed to load article history");
			hasMore = false;
		} finally {
			loading = false;
		}
	}

	async function banUser(userId: string) {
		try {
			const res = await fetch(`/api/admin/bans`, {
				method: "POST",
				body: JSON.stringify({ userId }),
			});

			if (!res.ok) throw new Error();

			toast.success("User banned successfully");
			revisions = revisions.map(
				(rev: { user: { id: string; isBanned: any } }) => ({
					...rev,
					user: {
						...rev.user,
						isBanned:
							rev.user.id === userId ? true : rev.user.isBanned,
					},
				}),
			);
		} catch {
			toast.error("Failed to ban user");
		}
	}
</script>

<svelte:head>
	<title>{"History: " + data.article.title}</title>
	<meta
		name="description"
		content="View the revisions for this article on Bliptext!"
	/>
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

	<HistoryList
		{revisions}
		{loading}
		{hasMore}
		onLoadMore={loadMore}
		onBanUser={banUser}
	/>
</div>
