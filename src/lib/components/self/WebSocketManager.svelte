<script lang="ts">
	export interface WebSocketManagerHandle {
		send: (data: any) => void;
		ws: WebSocket | null;
	}

	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { currentUser } from '$lib/stores/user';
	import CaptchaManager from './CaptchaManager.svelte';
	import { toast } from 'svelte-sonner';

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
		ws = new WebSocket(`${env.PUBLIC_WEBSOCKET_URL}?token=${wsToken}&type=${type}`);

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
		if (!ws) {
			getWebSocketToken()
				.then(initializeWebSocket)
				.catch((error) => {
					toast.error(`Connection failed: ${error.message}`);
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

{#if type === 'editor' && !$currentUser?.isBanned}
	<CaptchaManager />
{/if}

{@render children?.({ send })}
