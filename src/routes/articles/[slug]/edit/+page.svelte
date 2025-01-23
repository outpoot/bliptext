<script lang="ts">
	import type { Article } from '$lib/server/db/schema';
	import MarkdownViewer from '$lib/components/self/MarkdownViewer.svelte';
	import FloatingWord from '$lib/components/self/FloatingWord.svelte';
	import TableOfContents from '$lib/components/self/TableOfContents.svelte';
	import Tools from '$lib/components/self/Tools.svelte';
	import { onMount } from 'svelte';
	import { currentUser } from '$lib/stores/user';
	import type { Session } from 'better-auth';
	import { toast } from 'svelte-sonner';
	import { activeUsers } from '$lib/stores/activeUsers';
	import TosOverlay from '$lib/components/self/TosOverlay.svelte';
	import { tosAccepted } from '$lib/stores/tosAccepted';
	import { signIn } from '$lib/auth-client';
	import SignInConfirmDialog from '$lib/components/self/SignInConfirmDialog.svelte';
	import WebSocketManager, {
		type WebSocketManagerHandle
	} from '$lib/components/self/WebSocketManager.svelte';
	import Eye from 'lucide-svelte/icons/eye';

	let { data } = $props<{ data: { article: Article | null; session: Session } }>();
	let wsManager = $state<WebSocketManagerHandle | undefined>();

	let article = $state(data.article);

	let selectedWord = $state('');

	let mouseX = $state(0);
	let mouseY = $state(0);
	let showFloatingWord = $state(false);
	let showTos = $state(!$tosAccepted);
	let showConfirm = $state(false);
	let showMobileTools = $state(false);
	let showMobileContents = $state(false);

	async function handleSignIn() {
		await signIn.social({
			provider: 'discord',
			callbackURL: '/home'
		});
	}

	function handleMouseMove(e: MouseEvent) {
		mouseX = e.clientX;
		mouseY = e.clientY;
	}

	function handleInputKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && selectedWord) {
			showFloatingWord = true;
		} else if (e.key === 'Escape') {
			showFloatingWord = false;
		} else if (e.key === ' ') {
			e.preventDefault(); // Prevent spaces
		}
	}

	function handleInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const newWord = input.value.replace(/\s+/g, '').slice(0, 30);
		selectedWord = newWord;
		showFloatingWord = Boolean(newWord);
	}

	$effect(() => {
		if (!selectedWord) {
			showFloatingWord = false;
		}
	});

	function handleMessage(data: any) {
		if (data.type === 'active_users_update') {
			$activeUsers = data.data.count;
		}
	}

	function handleOpen() {
		wsManager?.send({
			type: 'set_article',
			article: {
				id: data.article?.id,
				slug: data.article?.slug
			}
		});
	}

	function handleClose(event: CloseEvent) {
		if (event.code === 4000) {
			toast.error('Disconnected: You opened this article on another device.', {
				duration: Infinity
			});
		}
	}

	onMount(() => {
		return () => {
			$activeUsers = 1;
		};
	});
</script>

<svelte:window onmousemove={handleMouseMove} />

{#if $currentUser === null}
	<div class="container mx-auto py-8">
		<div class="rounded-lg bg-destructive/10 p-4 text-destructive">
			<p>You must be logged in to edit articles.</p>
			<br />
			<p>
				Please <button onclick={() => (showConfirm = true)} class="text-primary hover:underline">
					sign in
				</button> to continue.
			</p>
		</div>
	</div>

	<SignInConfirmDialog bind:open={showConfirm} onConfirm={handleSignIn} />
{:else if $currentUser?.isBanned}
	<div class="container mx-auto py-8">
		<div class="rounded-lg bg-destructive/10 p-4 text-destructive">
			<p>Access to article editing has been restricted due to an account suspension.</p>
			<br />
			<p>
				While suspensions are carefully reviewed and rarely incorrect, you may <a
					href="https://discord.gg/cKWNV2uZUP"
					class="text-primary hover:underline">appeal here</a
				>. Note that banned accounts may also be restricted from the Discord server.
			</p>
			<br />
			<p>
				During this suspension period (indefinite), your account has limited access to interactive
				features, including article editing and viewing active content.
			</p>
		</div>
	</div>
{:else if data.article}
	<WebSocketManager
		bind:this={wsManager}
		type="editor"
		onMessage={handleMessage}
		onOpen={handleOpen}
		onClose={handleClose}
	/>
	<div class="container-2xl mx-auto py-8">
		<MarkdownViewer
			content={article.content}
			title={article.title}
			{article}
			showHeader={true}
			showSidebars={true}
			isEditPage={true}
			bind:selectedWord
			selfId={$currentUser?.id}
			onInputKeyDown={handleInputKeyDown}
			onInput={handleInput}
			onMouseMove={handleMouseMove}
		/>
		
		{#if showFloatingWord && selectedWord}
			<FloatingWord word={selectedWord} x={mouseX + 10} y={mouseY + 10} />
		{/if}
	</div>

	<TosOverlay bind:open={showTos} />
{:else}
	<div class="container mx-auto py-8">
		<p class="text-muted-foreground">Article not found</p>
	</div>
{/if}
