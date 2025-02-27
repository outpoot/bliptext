<script lang="ts">
	import { onMount } from "svelte";
	import { getUserColor } from "$lib/utils/userColors";

	let { word, image, element, x, y, editorName = '' } = $props<{
		word: string;
		image?: string;
		element?: HTMLElement;
		x?: number;
		y?: number;
		editorName: string;
	}>();

	const backgroundColor = $derived(getUserColor(editorName));

	const colors = [
		"#fecaca",
		"#fed7aa",
		"#fef08a",
		"#bbf7d0",
		"#bae6fd",
		"#ddd6fe",
		"#fbcfe8",
	];

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
	class="pointer-events-none z-50 rotate-3 select-none p-1 font-mono text-sm shadow-lg {image
		? 'opacity-90'
		: ''}"
	style:background-color={backgroundColor}
>
	<div class="relative flex items-center gap-2">
		{#if image}
			<img
				src={image}
				alt="The editor's profile."
				class="h-6 w-6 rounded-full border-2 border-white"
				loading="lazy"
				fetchpriority="low"
				decoding="async"
				crossorigin="anonymous"
				referrerpolicy="no-referrer"
			/>
		{/if}

		<span class:bold={isBold} class:italic={isItalic} class:link={isLink}>
			{displayText}
		</span>

		<div class="absolute inset-0 bg-white/10"></div>
	</div>
</div>

<style>
	div {
		transform-origin: 0 0;
		animation: float 1s ease-out infinite alternate;
	}
	.bold {
		font-weight: bold;
	}
	.italic {
		font-style: italic;
	}
	.link {
		text-decoration: underline;
		color: hsl(var(--primary));
	}
	@keyframes float {
		from {
			transform: rotate(3deg) translateY(0);
		}
		to {
			transform: rotate(3deg) translateY(-3px);
		}
	}
</style>
