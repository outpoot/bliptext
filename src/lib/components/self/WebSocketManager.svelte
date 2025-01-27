<script lang="ts">
	export interface WebSocketManagerHandle {
		send: (data: any) => void;
		ws: WebSocket | null;
	}

	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { PUBLIC_WEBSOCKET_URL, PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
	import { currentUser } from '$lib/stores/user';
	import { Turnstile } from 'svelte-turnstile';
	import { captchaToken } from '$lib/stores/captcha';

	type WebSocketType = 'viewer' | 'editor';

	let {
		type,
		onMessage,
		onOpen = undefined,
		onClose = undefined,
		disableReconnect = false,
		children
	} = $props<{
		type: WebSocketType;
		onMessage: (data: any) => void;
		onOpen?: () => void;
		onClose?: (event: CloseEvent) => void;
		disableReconnect?: boolean;
		children?: import('svelte').Snippet;
	}>();

	let ws = $state<WebSocket | null>(null);
	let reconnectAttempts = $state(0);
	let captchaVerified = $state(false);
	let captchaError = $state<string | null>(null);
	const MAX_RECONNECT_ATTEMPTS = 5;
	const BASE_DELAY = 1000;

	async function getWebSocketToken() {
		const res = await fetch('/api/generate-ws-token');
		if (!res.ok) {
			if (res.status === 401 && $currentUser) {
				toast.error('Your account is restricted from editing');
			}
			throw new Error('Failed to connect');
		}
		return (await res.json()).token;
	}

	async function initializeWebSocket(wsToken: string) {
		if (type === 'editor' && !$captchaToken) {
			throw new Error('CAPTCHA verification required');
		}

		ws = new WebSocket(
			`${PUBLIC_WEBSOCKET_URL}?token=${wsToken}&captcha=${$captchaToken}&type=${type}`
		);

		ws.addEventListener('open', () => {
			reconnectAttempts = 0;
			onOpen?.();
		});

		ws.addEventListener('message', (event) => {
			const data = JSON.parse(event.data);
			onMessage(data);
		});

		ws.addEventListener('close', async (event) => {
			if (onClose) {
				onClose(event);
				return;
			}

			if (disableReconnect || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
				toast.error('Failed to maintain connection. Please refresh the page.');
				return;
			}

			// Reset CAPTCHA state for reconnect
			captchaVerified = false;
			$captchaToken = null;

			const delay = BASE_DELAY * Math.pow(2, reconnectAttempts);
			reconnectAttempts++;

			await new Promise((resolve) => setTimeout(resolve, delay));
			handleReconnect();
		});
	}

	async function handleReconnect() {
		try {
			const token = await getWebSocketToken();
			await initializeWebSocket(token);
		} catch (error) {
			console.error('Reconnect failed:', error);
		}
	}

	$effect(() => {
		if (captchaVerified && $captchaToken && !ws) {
			getWebSocketToken()
				.then(initializeWebSocket)
				.catch((error) => {
					toast.error(`Connection failed: ${error.message}`);
					captchaVerified = false;
					$captchaToken = null;
				});
		}
	});

	onMount(() => {
		return () => {
			ws?.close();
			ws = null;
		};
	});

	export { ws as ws };

	export const send: WebSocketManagerHandle['send'] = (data) => {
		if (ws?.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(data));
		}
	};
</script>

{#if !captchaVerified && !$currentUser?.isBanned && type === 'editor'}
	<div class="captcha-overlay">
		<div class="captcha-container">
			<Turnstile
				siteKey={PUBLIC_TURNSTILE_SITE_KEY}
				on:callback={({ detail: { token } }) => {
					captchaVerified = true;
					$captchaToken = token;
					captchaError = null;
				}}
				on:error={({ detail: { code } }) => {
					captchaError = `CAPTCHA error: ${code}`;
					captchaVerified = false;
				}}
				on:expired={() => {
					captchaVerified = false;
					$captchaToken = null;
				}}
				theme="dark"
				size="normal"
			/>
			{#if captchaError}
				<p class="text-destructive">{captchaError}</p>
			{/if}
			<p class="mt-2 text-sm text-muted-foreground">Please verify you're human to continue</p>
		</div>
	</div>
{/if}

{@render children?.({ send })}

<style>
	.captcha-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.captcha-container {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		text-align: center;
	}
</style>
