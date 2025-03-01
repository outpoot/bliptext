<script lang="ts">
	import "../app.css";
	import { page } from "$app/state";
	import { Label } from "$lib/components/ui/label";
	import SearchBar from "$lib/components/self/SearchBar.svelte";
	import { signIn, signOut } from "$lib/auth-client";
	import { onMount } from "svelte";
	import { currentUser } from "$lib/stores/user";
	import { Toaster, toast } from "svelte-sonner";
	import SignInConfirmDialog from "$lib/components/self/SignInConfirmDialog.svelte";
	import { soundMuted } from "$lib/stores/soundMuted";
	import { theme } from "$lib/stores/theme";
	import { browser } from "$app/environment";
	import ThemeToggle from "$lib/components/self/ThemeToggle.svelte";
	import Logo from "$lib/components/self/Logo.svelte";

	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import LogOut from "lucide-svelte/icons/log-out";
	import UserX from "lucide-svelte/icons/user-x";
	import Shield from "lucide-svelte/icons/shield";
	import Book from "lucide-svelte/icons/book";
	import Volume2 from "lucide-svelte/icons/volume-2";
	import VolumeX from "lucide-svelte/icons/volume-x";

	import SearchIcon from "lucide-svelte/icons/search";
	import FilePlus from "lucide-svelte/icons/file-plus";
	import Ban from "lucide-svelte/icons/ban";
	import X from "lucide-svelte/icons/x";
	import { Button } from "$lib/components/ui/button";
	import { styles } from "$lib/utils/styles";
	import Search from "lucide-svelte/icons/search";
	import { invalidateAll } from "$app/navigation";
	let searchDialogOpen = $state(false);

	async function handleSignIn() {
		await signIn.social({
			provider: "discord",
			callbackURL: `${page.url.pathname}?signIn=1`,
		});
	}

	async function handleSignOut() {
		await signOut();
		currentUser.set(null);
	}

	async function handleDeleteAccount() {
		if (
			confirm(
				"Are you sure you want to delete your account? This action cannot be undone.",
			)
		) {
			try {
				const response = await fetch("/api/account/delete", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.details || "Failed to delete account");
				}

				currentUser.set(null);
				window.location.href = "/";
			} catch (error) {
				console.error("Failed to delete account:", error);
				toast.error("Failed to delete account", {
					description:
						error instanceof Error
							? error.message
							: "Unknown error occurred",
				});
			}
		}
	}

	let { data, children } = $props<{
		data: { userSession?: any; theme: string };
		children: any;
	}>();

	let isHomePage = $derived(page.url.pathname === "/");

	let showConfirm = $state(false);

	$effect(() => {
		if (data?.userSession) {
			currentUser.set(data.userSession);
		} else {
			currentUser.set(null);
		}
	});

	onMount(() => {
		if (browser && data.theme) {
			theme.set(data.theme as "light" | "dark" | "lyntr");
		}
	});

	onMount(() => {
		console.log(
			"%c                                             ___   \n    _____                                   /\\  \\  \n   /::\\  \\                     ___         /::\\  \\ \n  /:/\\:\\  \\                   /\\__\\       /:/\\:\\__\\\n /:/ /::\\__\\   ___     ___   /:/__/      /:/ /:/  /\n/:/_/:/\\:|__| /\\  \\   /\\__\\ /::\\  \\     /:/_/:/  / \n\\:\\/:/ /:/  / \\:\\  \\ /:/  / \\/\\:\\  \\__  \\:\\/:/  /  \n \\::/_/:/  /   \\:\\  /:/  /   ~~\\:\\/\\__\\  \\::/__/   \n  \\:\\/:/  /     \\:\\/:/  /       \\::/  /   \\:\\  \\   \n   \\::/  /       \\::/  /        /:/  /     \\:\\__\\  \n    \\/__/         \\/__/         \\/__/       \\/__/",
			"color: #4962ee; font-family: monospace; font-size: 12px; font-weight: bold; text-shadow: 2px 2px rgba(0,0,0,0.2);",
		);
		console.log(
			"%c Welcome to Bliptext! DO NOT FUCKING PASTE ANYTHING IN THE CONSOLE UNLESS YOU KNOW WHAT YOU ARE DOING.",
			"color: #4962ee; font-family: monospace; font-size: 12px; font-weight: bold; text-shadow: 2px 2px rgba(0,0,0,0.2);",
		);
		console.log(
			"%c A product by Outpoot.com",
			"color: #4962ee; font-family: monospace; font-size: 12px; font-weight: bold; text-shadow: 2px 2px rgba(0,0,0,0.2);",
		);

		const url = new URL(window.location.href);
		if (url.searchParams.has("signedIn")) {
			invalidateAll();
		}
	});
</script>

<Toaster />
{#if isHomePage}
	{@render children()}
{:else}
	<div class="flex min-h-screen flex-col">
		<header class="border-b">
			<div class="container-2xl mx-auto flex h-16 items-center px-4">
				<div class="w-[200px]">
					<a
						href="/home"
						class="flex cursor-pointer items-center gap-2"
					>
						<Logo className="h-8 w-8 text-primary" />
						<Label
							class="cursor-pointer text-2xl font-bold"
							style="font-family: 'LinLibertine'">Bliptext</Label
						>
						{#if $currentUser?.isAdmin}
							<span class="text-[0.5rem] md:text-xs">| Admin</span
							>
						{/if}
					</a>
				</div>

				<!-- Large screen search bar & categories -->
				<div class="hidden flex-1 md:flex md:justify-center">
					<SearchBar class="w-full max-w-2xl" />
				</div>

				<!-- Small screen icons for search & categories -->
				<div class="w-[200px] flex justify-end items-center gap-4">
					<!-- Mobile search icon -->
					<Button
						variant="outline"
						onclick={() => (searchDialogOpen = true)}
						class="md:hidden"
					>
						<SearchIcon class="h-6 w-6" />
					</Button>

					<ThemeToggle />

					{#if $currentUser}
						<DropdownMenu>
							<DropdownMenuTrigger>
								<img
									src={$currentUser.image}
									class="h-8 w-8 cursor-pointer rounded-full"
									alt={`@${$currentUser.name}'s Profile Picture`}
								/>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem>
									<span class={styles.buttonClass}>
										Signed in as @{$currentUser.name}
									</span>
								</DropdownMenuItem>
								<DropdownMenuSeparator />

								<DropdownMenuItem>
									<a
										href="/legal/privacy"
										class={styles.buttonClass}
									>
										<Shield class={styles.iconClass} />
										<span>Privacy Policy</span>
									</a>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<a
										href="/legal/terms"
										class={styles.buttonClass}
									>
										<Book class={styles.iconClass} />
										<span>Terms of Service</span>
									</a>
								</DropdownMenuItem>
								<DropdownMenuSeparator />

								<DropdownMenuItem>
									<a
										href="/blipper"
										class="text-primary {styles.buttonClass}"
									>
										<Search class={styles.iconClass} />
										<span>Blipper</span>
									</a>
								</DropdownMenuItem>

								{#if $currentUser.isAdmin}
									<DropdownMenuItem>
										<a
											href="/admin/new"
											class="text-primary {styles.buttonClass}"
										>
											<FilePlus
												class={styles.iconClass}
											/>
											<span>New</span>
										</a>
									</DropdownMenuItem>
									<DropdownMenuItem>
										<a
											href="/admin/bans"
											class="text-primary {styles.buttonClass}"
										>
											<Ban class={styles.iconClass} />
											<span>Bans</span>
										</a>
									</DropdownMenuItem>
									<DropdownMenuItem>
										<a
											href="/admin/terminator"
											class="text-primary {styles.buttonClass}"
										>
											<Shield class={styles.iconClass} />
											<span>Terminator</span>
										</a>
									</DropdownMenuItem>
								{/if}
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									<button
										type="button"
										onclick={() =>
											soundMuted.update((m) => !m)}
										class={styles.buttonClass}
									>
										{#if $soundMuted}
											<VolumeX class={styles.iconClass} />
											<span>Unmute sounds</span>
										{:else}
											<Volume2 class={styles.iconClass} />
											<span>Mute sounds</span>
										{/if}
									</button>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<button
										type="button"
										onclick={handleSignOut}
										class="{styles.buttonClass} plausible-event-name--Sign-Out"
									>
										<LogOut class={styles.iconClass} />
										<span>Sign out</span>
									</button>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<button
										type="button"
										onclick={handleDeleteAccount}
										class="text-destructive {styles.buttonClass} plausible-event-name--Delete-Account"
									>
										<UserX class={styles.iconClass} />
										<span>Delete account</span>
									</button>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					{:else if $currentUser == undefined}
						<button
							onclick={() => (showConfirm = true)}
							class="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground plausible-event-name--Sign-In"
						>
							Sign in
						</button>

						<SignInConfirmDialog
							bind:open={showConfirm}
							onConfirm={handleSignIn}
						/>
					{/if}
				</div>
			</div>
		</header>

		<main class="flex-1">
			{@render children()}
		</main>

		<footer class="border-t">
			<div
				class="container mx-auto flex h-16 items-center justify-between px-4"
			>
				<p class="text-sm text-muted-foreground">
					© {new Date().getFullYear()} Bliptext
				</p>
				<nav class="flex items-center gap-4">
					<a
						href="/legal/about"
						class="text-sm text-muted-foreground hover:text-foreground"
						>About</a
					>
					<a
						href="/legal/privacy"
						class="text-sm text-muted-foreground hover:text-foreground"
						>Privacy</a
					>
					<a
						href="/legal/terms"
						class="text-sm text-muted-foreground hover:text-foreground"
						>Terms</a
					>
					<a
						href="https://status.bliptext.com"
						class="text-sm text-muted-foreground hover:text-foreground"
						>Status</a
					>
				</nav>
			</div>
		</footer>
	</div>
{/if}

{#if searchDialogOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
	>
		<div class="relative w-full max-w-lg">
			<div class="mb-2 flex items-center justify-end">
				<button
					class="group rounded-md bg-transparent px-2.5 py-2 text-sm font-medium"
					onclick={() => (searchDialogOpen = false)}
				>
					<X class={styles.iconClass} />
				</button>
			</div>

			<SearchBar
				class="w-full"
				includeRandom={true}
				onNavigate={() => (searchDialogOpen = false)}
			/>
		</div>
	</div>
{/if}
