<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import SearchBar from '$lib/components/self/SearchBar.svelte';

	let { children } = $props();
	let isHomePage = $derived(page.url.pathname === '/');
</script>

{#if isHomePage}
	{@render children()}
{:else}
	<div class="flex min-h-screen flex-col">
		<header class="border-b">
			<div class="container mx-auto flex h-16 items-center px-4">
				<a href="/" class="flex items-center gap-2">
					<img src="/images/logo.svg" alt="Bliptext" class="h-8 w-8" />
					<Label class="text-2xl font-bold" style="font-family: 'LinLibertine'">Bliptext</Label>
				</a>

				<Separator orientation="vertical" class="mx-4 h-6" />

				<SearchBar class="max-w-md flex-1" />

				<nav class="ml-4 flex items-center gap-4">
					<a href="/articles/new" class="text-sm text-muted-foreground hover:text-foreground">New</a>
					<a href="/categories" class="text-sm text-muted-foreground hover:text-foreground"
						>Categories</a
					>
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
