<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { Label } from '$lib/components/ui/label';
	import SearchBar from '$lib/components/self/SearchBar.svelte';
	import { signIn, client } from '$lib/auth-client';
	import { onMount } from 'svelte';
    import { currentUser } from '$lib/stores/user';

	const session = client.useSession();

	async function handleSignIn() {
		await signIn.social({
			provider: 'discord',
			callbackURL: '/home'
		});
	}

	let { children } = $props();
	let isHomePage = $derived(page.url.pathname === '/');

	onMount(async () => {
		const meResponse = await fetch('/api/me');
		
		if (meResponse.ok) {
			const userData = await meResponse.json();
			currentUser.set(userData);
		} else {
			await fetch('/api/account', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
		}
	});
</script>

{#if isHomePage}
	{@render children()}
{:else}
	<div class="flex min-h-screen flex-col">
		<header class="border-b">
			<div class="container-2xl mx-auto flex h-16 items-center justify-between px-4">
				<a href="/" class="flex items-center gap-2">
					<img src="/images/logo.svg" alt="Bliptext" class="h-8 w-8" />
					<Label class="text-2xl font-bold" style="font-family: 'LinLibertine'">Bliptext</Label>
				</a>

				<div class="flex-1 px-16">
					<SearchBar class="mx-auto max-w-2xl" />
				</div>

				<nav class="flex items-center gap-2">
					<a
						href="/articles/new"
						class="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
					>
						New
					</a>
					<a
						href="/categories"
						class="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
					>
						Categories
					</a>
					{#if $currentUser}
						<a
							href="/profile"
							class="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
							>@{$currentUser.name}</a
						>
					{:else}
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
				<p class="text-sm text-muted-foreground">© 2024 Bliptext</p>
				<nav class="flex items-center gap-4">
					<a href="/about" class="text-sm text-muted-foreground hover:text-foreground">About</a>
					<a href="/privacy" class="text-sm text-muted-foreground hover:text-foreground">Privacy</a>
					<a href="/terms" class="text-sm text-muted-foreground hover:text-foreground">Terms</a>
				</nav>
			</div>
		</footer>
	</div>
{/if}
