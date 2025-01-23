<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { Label } from '$lib/components/ui/label';
	import SearchBar from '$lib/components/self/SearchBar.svelte';
	import { signIn, signOut } from '$lib/auth-client';
	import { onMount } from 'svelte';
	import { currentUser } from '$lib/stores/user';
	import { getSession } from '$lib/auth-client';
	import { Toaster, toast } from 'svelte-sonner';
	import SignInConfirmDialog from '$lib/components/self/SignInConfirmDialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import LogOut from 'lucide-svelte/icons/log-out';
	import UserX from 'lucide-svelte/icons/user-x';
	import Shield from 'lucide-svelte/icons/shield';
	import Book from 'lucide-svelte/icons/book';

	async function handleSignIn() {
		await signIn.social({
			provider: 'discord',
			callbackURL: '/home'
		});
	}

	async function handleSignOut() {
		await signOut();
		currentUser.set(null);
	}

	async function handleDeleteAccount() {
		if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
			try {
				const response = await fetch('/api/account/delete', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					}
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.details || 'Failed to delete account');
				}

				currentUser.set(null);
				window.location.href = '/';
			} catch (error) {
				console.error('Failed to delete account:', error);
				toast.error('Failed to delete account', {
					description: error instanceof Error ? error.message : 'Unknown error occurred'
				});
			}
		}
	}

	let { children } = $props();
	let isHomePage = $derived(page.url.pathname === '/');

	let showConfirm = $state(false);

	onMount(async () => {
		const { data } = await getSession();

		if (data?.user) {
			// @ts-ignore im pretty sure its some betterauth thing
			currentUser.set(data.user);
		} else {
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
						<span class="text-[0.5rem] md:text-xs">| Admin</span>
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
						<DropdownMenu>
							<DropdownMenuTrigger>
								<img
									src={$currentUser.image}
									class="h-8 w-8 cursor-pointer rounded-full"
									alt={`@${$currentUser.name}'s Profile Picture'`}
								/>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem>
									Signed in as @{$currentUser.name}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									<a href="/legal/privacy" class="flex w-full items-center">
										<Shield class="mr-2 h-4 w-4" />
										<span>Privacy Policy</span>
									</a>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<a href="/legal/terms" class="flex w-full items-center">
										<Book class="mr-2 h-4 w-4" />
										<span>Terms of Service</span>
									</a>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onclick={handleSignOut} class="cursor-pointer">
									<LogOut class="mr-2 h-4 w-4" />
									<span>Sign out</span>
								</DropdownMenuItem>
								<DropdownMenuItem
									class="cursor-pointer text-destructive"
									onclick={handleDeleteAccount}
								>
									<UserX class="mr-2 h-4 w-4" />
									<span>Delete account</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					{:else if $currentUser == undefined}
						<button
							onclick={() => (showConfirm = true)}
							class="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
						>
							Sign in
						</button>

						<SignInConfirmDialog bind:open={showConfirm} onConfirm={handleSignIn} />
					{/if}
				</nav>
			</div>
		</header>

		<main class="flex-1">
			{@render children()}
		</main>

		<footer class="border-t">
			<div class="container mx-auto flex h-16 items-center justify-between px-4">
				<p class="text-sm text-muted-foreground">© {new Date().getFullYear()} Bliptext</p>
				<nav class="flex items-center gap-4">
					<a href="/legal/about" class="text-sm text-muted-foreground hover:text-foreground"
						>About</a
					>
					<a href="/legal/privacy" class="text-sm text-muted-foreground hover:text-foreground"
						>Privacy</a
					>
					<a href="/legal/terms" class="text-sm text-muted-foreground hover:text-foreground"
						>Terms</a
					>
				</nav>
			</div>
		</footer>
	</div>
{/if}
