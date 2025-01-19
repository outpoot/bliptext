<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { Label } from '$lib/components/ui/label';
	import SearchBar from '$lib/components/self/SearchBar.svelte';
	import { signIn } from '$lib/auth-client';
	import { onMount } from 'svelte';
	import { currentUser } from '$lib/stores/user';
	import { getSession } from '$lib/auth-client';
	import { Toaster } from 'svelte-sonner';

	async function handleSignIn() {
		await signIn.social({
			provider: 'discord',
			callbackURL: '/home'
		});
	}

	let { children } = $props();
	let isHomePage = $derived(page.url.pathname === '/');

	onMount(async () => {
		const { data } = await getSession();

		if (data?.user) {
			// @ts-ignore im pretty sure its some betterauth thing
			currentUser.set(data.user);
		} else {
			// TODO: show error via toast
			currentUser.set(null);
		}
	});
</script>

<Toaster />
{#if isHomePage}
	{@render children()}
{:else}
	<div class="flex min-h-screen flex-col">
		<header class="border-b">
			<div class="container-2xl mx-auto flex h-16 items-center justify-between px-4">
				<a href="/home" class="flex cursor-pointer items-center gap-2">
					<img src="/images/logo.svg" alt="Bliptext" class="h-8 w-8" />
					<Label class="cursor-pointer text-2xl font-bold" style="font-family: 'LinLibertine'"
						>Bliptext</Label
					>
					{#if $currentUser?.isAdmin}
						<span class="text-xs">| Admin</span>
					{/if}
				</a>

				<div class="flex-1 px-16">
					<SearchBar class="mx-auto max-w-2xl" />
				</div>

				<nav class="flex items-center gap-2">
					{#if $currentUser?.isAdmin}
						<a
							href="/articles/new"
							class="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
						>
							New
						</a>
						<a
							href="/admin/bans"
							class="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
						>
							Bans
						</a>
					{/if}
					<a
						href="/categories"
						class="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
					>
						Categories
					</a>
					{#if $currentUser}
						<!-- TODO: make a dropdown with options on click -->
						<img
							src={$currentUser.image}
							class="h-8 w-8 rounded-full"
							alt={`@${$currentUser.name}'s Profile Picture'`}
						/>
					{:else if $currentUser == undefined}
						<button
							onclick={handleSignIn}
							class="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
						>
							Sign in
						</button>
					{/if}
				</nav>
			</div>
		</header>

		<main class="flex-1">
			{@render children()}
		</main>

		<footer class="border-t">
			<div class="container mx-auto flex h-16 items-center justify-between px-4">
				<p class="text-sm text-muted-foreground">© 2025 Bliptext</p>
				<nav class="flex items-center gap-4">
					<a href="/about" class="text-sm text-muted-foreground hover:text-foreground">About</a>
					<a href="/privacy" class="text-sm text-muted-foreground hover:text-foreground">Privacy</a>
					<a href="/terms" class="text-sm text-muted-foreground hover:text-foreground">Terms</a>
				</nav>
			</div>
		</footer>
	</div>
{/if}
