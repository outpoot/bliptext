<script lang="ts">
	export interface WebSocketManagerHandle {
		send: (data: any) => void;
	}

	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { PUBLIC_WEBSOCKET_URL } from '$env/static/public';
	import { currentUser } from '$lib/stores/user';

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

	async function initializeWebSocket(token: string) {
		ws = new WebSocket(`${PUBLIC_WEBSOCKET_URL}?token=${token}&type=${type}`);

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
			const newToken = await getWebSocketToken();
			initializeWebSocket(newToken);
		});

		return ws;
	}

	export const send: WebSocketManagerHandle['send'] = (data: any) => {
		if (ws?.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(data));
		}
	};

	onMount(() => {
		getWebSocketToken().then((token) => initializeWebSocket(token));

		return () => {
			ws?.close();
			ws = null;
		};
	});
</script>

{@render children?.({ send })}
