<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { fade } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { Input } from '$lib/components/ui/input';

	let { data } = $props<{
		data: {
			bannedUsers: Array<{
				id: string;
				name: string;
				image: string;
				bannedAt: string;
				bannedBy: {
					id: string;
					name: string;
				};
			}>;
		};
	}>();

	let searchQuery = $state('');
	let filteredUsers = $derived(
		data.bannedUsers.filter((user: { name: string; }) => user.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);

	async function unbanUser(userId: string) {
		try {
			const res = await fetch(`/api/admin/bans`, {
				method: 'DELETE',
				body: JSON.stringify({ userId })
			});

			if (!res.ok) throw new Error();

			toast.success('User unbanned successfully');
			data = {
				...data,
				bannedUsers: data.bannedUsers.filter((user: { id: string }) => user.id !== userId)
			};
		} catch {
			toast.error('Failed to unban user');
		}
	}

	function formatDate(date: string) {
		return new Date(date).toLocaleString();
	}
</script>

<svelte:head>
	<title>Banned Users - Admin</title>
	<meta name="description" content="Manage banned users in the admin panel. Unban users and view details about banned users." />
</svelte:head>

<div class="container mx-auto px-4 py-4 sm:py-8">
	<div class="mb-4 sm:mb-8">
		<h1 class="text-2xl font-bold sm:text-3xl">Bans</h1>
		<p class="text-sm text-muted-foreground sm:text-base">Manage banned users</p>
	</div>

	<div class="mb-4">
		<Input type="search" placeholder="Search by username..." bind:value={searchQuery} />
	</div>

	<div class="space-y-3 sm:space-y-4">
		{#each filteredUsers as user (user.id)}
			<div transition:fade>
				<Card class="p-3 sm:p-4">
					<div class="flex items-start gap-3 sm:gap-4">
						<Avatar class="h-8 w-8 sm:h-10 sm:w-10">
							<AvatarImage src={user.image} alt={user.name} />
							<AvatarFallback>
								<img src="/images/unknown.png" alt="Unknown user" />
							</AvatarFallback>
						</Avatar>
						<div class="min-w-0 flex-1">
							<div
								class="mb-1 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between"
							>
								<span class="truncate font-medium">{user.name}</span>
								<span class="text-xs text-muted-foreground sm:text-sm">
									Banned on {formatDate(user.bannedAt)}
								</span>
							</div>
							<p class="text-xs text-muted-foreground sm:text-sm">
								Banned by @{user.bannedByUser?.name || 'Unknown'}
							</p>
						</div>
						<Button variant="outline" size="sm" onclick={() => unbanUser(user.id)}>Unban</Button>
					</div>
				</Card>
			</div>
		{/each}

		{#if filteredUsers.length === 0}
			<Card class="p-4">
				{#if searchQuery}
					<p class="text-center text-sm text-muted-foreground">
						No banned users found matching "{searchQuery}"
					</p>
				{:else}
					<p class="text-center text-sm text-muted-foreground">No banned users found</p>
				{/if}
			</Card>
		{/if}
	</div>
</div>
