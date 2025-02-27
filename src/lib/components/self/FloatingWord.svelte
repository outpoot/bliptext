<script lang="ts">
	import { onMount } from "svelte";
	import { getUserColor } from "$lib/utils/userColors";

	let {
		word,
		image,
		element,
		x,
		y,
		editorName = "",
	} = $props<{
		word: string;
		image?: string;
		element?: HTMLElement;
		x?: number;
		y?: number;
		editorName: string;
	}>();

	const backgroundColor = $derived(getUserColor(editorName));

	const isBold = $derived(word.startsWith("**") && word.endsWith("**"));
	const isItalic = $derived(word.startsWith("*") && word.endsWith("*"));
	const isLink = $derived(word.startsWith("[") && word.includes("]("));
	const displayText = $derived(
		isBold
			? word.slice(2, -2)
			: isItalic
				? word.slice(1, -1)
				: isLink
					? (word.match(/\[(.*?)\]/)?.[1] ?? word)
					: word,
	);

	let isMobile = false;
	let floatingEl: HTMLDivElement;

	onMount(() => {
		isMobile = window.matchMedia("(max-width: 768px)").matches;
	});

	function updatePosition() {
		if (!floatingEl) return;

		if (element && isMobile) {
			const rect = element.getBoundingClientRect();
			floatingEl.style.position = "fixed";
			floatingEl.style.left = `${rect.left + rect.width + 5}px`;
			floatingEl.style.top = `${rect.top + 5}px`;
		} else if (element) {
			// On desktop, keep original cursor-following behavior
			const rect = element.getBoundingClientRect();
			floatingEl.style.position = "fixed";
			floatingEl.style.left = `${rect.left}px`;
			floatingEl.style.top = `${rect.top - 10}px`;
		} else if (x !== undefined && y !== undefined) {
			floatingEl.style.position = "fixed";
			floatingEl.style.left = `${x}px`;
			floatingEl.style.top = `${y}px`;
		}
	}

	$effect(() => {
		updatePosition();
		if (element) {
			window.addEventListener("scroll", updatePosition);
			window.addEventListener("resize", updatePosition);
		}

		return () => {
			window.removeEventListener("scroll", updatePosition);
			window.removeEventListener("resize", updatePosition);
		};
	});
</script>

<div
	bind:this={floatingEl}
	class="floating-container pointer-events-none z-50 select-none rounded-md shadow-lg"
	style:background-color={backgroundColor}
	style:opacity="0.9"
>
	<div class="flex items-center gap-2 px-2 py-1">
		{#if image}
			<img
				src={image}
				alt="The editor's profile."
				class="h-5 w-5 rounded-full border border-white"
				loading="lazy"
				fetchpriority="low"
				decoding="async"
				crossorigin="anonymous"
				referrerpolicy="no-referrer"
			/>
		{/if}

		<span
			class="text-xs font-mono {isBold ? 'font-bold' : ''} {isItalic
				? 'italic'
				: ''} {isLink ? 'underline text-primary' : ''}"
		>
			{displayText}
		</span>
	</div>
</div>

<style>
	.floating-container {
		transform: rotate(2deg);
		transform-origin: center center;
		animation: float 1.5s ease-in-out infinite alternate;
	}

	@keyframes float {
		from {
			transform: rotate(2deg) translateY(0);
		}
		to {
			transform: rotate(2deg) translateY(-3px);
		}
	}
</style>
