<script lang="ts">
	let { word, x, y } = $props<{
		word: string;
		x: number;
		y: number;
	}>();

	const colors = ['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#bae6fd', '#ddd6fe', '#fbcfe8'];

	const backgroundColor = colors[Math.floor(Math.random() * colors.length)];

	const isBold = $derived(word.startsWith('**') && word.endsWith('**'));
	const isItalic = $derived(word.startsWith('*') && word.endsWith('*'));
	const isLink = $derived(word.startsWith('[') && word.includes(']('));
	const displayText = $derived(
		isBold
			? word.slice(2, -2)
			: isItalic
				? word.slice(1, -1)
				: isLink
					? (word.match(/\[(.*?)\]/)?.[1] ?? word)
					: word
	);
</script>

<div
	class="pointer-events-none fixed z-50 rotate-3 select-none p-3 font-mono text-sm shadow-lg"
	style:left="{x}px"
	style:top="{y}px"
	style:background-color={backgroundColor}
>
	<div class="relative">
		<span class:bold={isBold} class:italic={isItalic} class:link={isLink}>
			{displayText}
		</span>
		<div class="absolute inset-0 bg-white/10" />
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
