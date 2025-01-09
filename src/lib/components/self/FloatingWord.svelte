<script lang="ts">
	export let word: string;
	export let x: number;
	export let y: number;
	
	const colors = [
		'#fecaca', // red-200
		'#fed7aa', // orange-200
		'#fef08a', // yellow-200
		'#bbf7d0', // green-200
		'#bae6fd', // blue-200
		'#ddd6fe', // purple-200
		'#fbcfe8'  // pink-200
	];
	
	const backgroundColor = colors[Math.floor(Math.random() * colors.length)];
</script>

<div
	class="fixed pointer-events-none z-50 select-none rotate-3 p-3 font-mono text-sm shadow-lg"
	style:left="{x}px"
	style:top="{y}px"
	style:background-color={backgroundColor}
>
	<div class="relative">
		{word}
		<div class="absolute inset-0 bg-white/10"></div>
	</div>
</div>

<style>
	div {
		transform-origin: 0 0;
		animation: float 1s ease-out infinite alternate;
	}

	@keyframes float {
		from { transform: rotate(3deg) translateY(0); }
		to { transform: rotate(3deg) translateY(-3px); }
	}
</style>
