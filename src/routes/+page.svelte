<script lang="ts">
	import LogoBlink from '$lib/components/self/LogoBlink.svelte';
	import TooltipButton from '$lib/components/self/TooltipButton.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Search, Sparkles } from 'lucide-svelte';

	const categories = [
		{
			icon: '/icons/wattesigma.svg',
			title: 'Wattesigma',
			desc: 'An overly dramatic Web Browser made with a game engine. Shaders, bugs, and obscure search engines!',
			href: 'https://wattesigma.com'
		},
		{
			icon: '/icons/bussinx.png',
			title: 'Bussin X',
			desc: 'An esoteric Programming Language inspired by internet slang. lit x be nocap rn',
			href: 'https://github.com/face-hh/bussin'
		},
		{
			icon: '/icons/griddycode.png',
			title: 'GriddyCode',
			desc: 'An overly dramatic Code Editor made with a game engine. Soothing zooms, glow, shaders, Lua extensibility & more!',
			href: 'https://github.com/face-hh/griddycode'
		},
		{
			icon: '/icons/lyntr.svg',
			title: 'Lyntr',
			desc: 'Micro-blogging Social Media similar to Twitter, but with an IQ test.',
			href: 'https://github.com/face-hh/lyntr'
		},
		{
			icon: '/icons/webx.png',
			title: 'Bussin Web X',
			desc: 'An alternative for the World Wide Web - browse websites such as buss://yippie.rizz made in HTML, CSS and Lua. Custom web browser, HTML rendering engine, search engine & more.',
			href: 'https://github.com/face-hh/webx'
		},
		{
			icon: '/icons/lawmaxxing.png',
			title: 'Lawmaxxing',
			desc: 'A maps application, that reports you to the police if detected speeding.',
			href: 'https://github.com/face-hh/lawmaxxing'
		},
		{
			icon: '/icons/subterfuge.png',
			title: 'Subterfuge',
			desc: 'A gamified CLI tool for learning TypeScript through progressive Leetcode-like challenges and unlockable features.',
			href: 'https://github.com/face-hh/subterfuge'
		},
		{
			icon: '/icons/bruh.png',
			title: 'BRUH',
			desc: 'An unconventional Image Format, that stores pixel data as plain-text hexadecimal values with ".bruh" extension.',
			href: 'https://github.com/face-hh/lawmaxxing'
		},
		{
			icon: '/icons/fextify.webp',
			title: 'Fextify',
			desc: 'A minimalist markdown Note-taking app with local storage, custom themes, multi-page support and real-time preview.',
			href: 'https://github.com/face-hh/fextify'
		},
		{
			icon: '/icons/0xbj.png',
			title: '0xBJ',
			desc: 'A computer Virus that hijacks your system until you win 10 games of Blackjack. BSOD triggers, sound effects, unclosable Family Guy clips, sigma edits & more.',
			href: 'https://github.com/face-hh/0xbj'
		},
		{
			icon: '/icons/yappacino.png',
			title: 'Yappacino',
			desc: 'A verbose JavaScript superset that makes you yap a lot.',
			href: 'https://github.com/face-hh/yappacino'
		},
		{
			icon: '/icons/darkaroo.png',
			title: 'Darkaroo',
			desc: 'A browser extension that maximizes ad exposure through forced keep-eye-contact ads, pop-ups, and voice-controlled dismissal.',
			href: 'https://github.com/face-hh/darkaroo'
		},
		{
			icon: '/icons/more.svg',
			title: 'Explore more on GitHub',
			desc: "There are other projects that weren't featured here!",
			href: 'https://github.com/face-hh?tab=repositories&q=&type=&language=&sort=stargazers'
		}
	];
</script>

<div class="flex h-screen flex-col items-center gap-4 pt-24">
	<!-- Hero section -->
	<div class="pointer-events-none flex select-none flex-col items-center gap-4">
		<Label class="text-7xl font-bold" style="font-family: 'LinLibertine'">Bliptext</Label>
		<Label class="text-xl">
			A wiki where you can edit <span class="text-primary">one word</span> every 5 minutes.
		</Label>
	</div>

	<LogoBlink />

	<!-- Search functionality -->
	<div class="w-full max-w-xl px-4">
		<div class="flex gap-3">
			<div
				class="relative flex flex-1 [&:has(input:focus-visible)>button]:ring-1 [&:has(input:focus-visible)>button]:ring-ring"
			>
				<Input type="search" placeholder="Dogs..." class="h-12 w-full rounded-r-none text-lg" />
				<Button variant="outline" class="h-12 rounded-l-none border-l-0">
					<Search class="h-5 w-5" />
				</Button>
			</div>
			<TooltipButton icon={Sparkles} tooltipText="View random article" buttonClass="h-12" />
		</div>
	</div>

	<Separator class="my-6" />

	<!-- Author -->
	<div class="rounded-lg border p-4">
		<div class="flex items-center justify-center gap-1 text-sm text-foreground">
			Bliptext is a project by
			<a href="https://youtube.com/facedevstuff" class="inline-flex items-center">
				<span class="flex items-center rounded-md bg-primary/50 px-2 py-1 font-bold">
					<img src="/images/facedev.png" alt="FaceDev" class="mr-1 size-4 rounded-full" />
					FaceDev
				</span>
			</a>
		</div>
	</div>

	<!-- Project list -->
	<div class="grid w-full max-w-[100rem] grid-cols-5 gap-4 px-4">
		{#each categories as item}
			<a
				href={item.href}
				class="group flex items-start gap-4 rounded-lg border p-4 no-underline transition-colors hover:bg-muted"
			>
				<img
					src={item.icon}
					alt={item.title}
					class="size-6 text-primary transition-transform group-hover:scale-105"
				/>
				<div>
					<h3 class="font-semibold text-foreground">{item.title}</h3>
					<p class="text-sm text-muted-foreground">{item.desc}</p>
				</div>
			</a>
		{/each}
	</div>
</div>
