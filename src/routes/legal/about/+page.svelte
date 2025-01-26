<script lang="ts">
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '$lib/components/ui/card';
	import LogoBlink from '$lib/components/self/LogoBlink.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import Paintbrush from 'lucide-svelte/icons/paintbrush';
</script>

<svelte:head>
	<title>About: Bliptext</title>
	<meta name="description" content="Learn more about Bliptext, the wiki where you edit 1 word each 30 seconds." />
	<meta name="keywords" content="article, edit, markdown, wikipedia, wiki" />
	<meta property="og:title" content="About: Bliptext" />
	<meta property="og:description" content="Learn more about Bliptext, the wiki where you edit 1 word each 30 seconds." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={window.location.href} />
	<meta property="og:image" content="/favicon.svg" />
</svelte:head>

<section class="py-10 text-center">
	<div class="container mx-auto px-4">
		<div class="flex items-center justify-center gap-3">
			<LogoBlink width="w-14" />
			<h1
				class="text-6xl font-extrabold tracking-tight"
				style="font-family: 'LinLibertine', serif;"
			>
				Bliptext
			</h1>
		</div>
		<p class="mx-auto mt-4 max-w-3xl text-2xl" style="font-family: 'LinLibertine', serif;">
			Wikipedia meets
			<Badge variant="outline" class="inline-flex items-center gap-1 align-middle text-xl">
				<Paintbrush class="h-5 w-5" />
				r/place
			</Badge>
			, change <span class="font-bold text-primary">one word</span> every
			<span class="font-bold text-primary">30 seconds</span>.
		</p>
	</div>
</section>

<section class="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-[2fr_1fr] md:py-16">
	<div class="space-y-8">
		<Card>
			<CardHeader>
				<CardTitle class="text-3xl">What is this?</CardTitle>
				<CardDescription>why dude</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<p>We ported the entire English Wikipedia and made every word editable.</p>
				<p>
					The reason? I saw a lot of complaints about Wikipedia's content on social media and
					thought "what if we let everyone edit that?" So here we are.
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="text-3xl">Who's behind?</CardTitle>
				<CardDescription>who the fuck would do this?</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<p>
					Made by <a
						href="https://youtube.com/facedevstuff"
						class="inline-flex items-center"
						target="_blank"
					>
						<span class="flex items-center rounded-md bg-primary/50 px-2 py-1 font-bold">
							<img src="/images/facedev.png" alt="FaceDev" class="mr-1 size-4 rounded-full" />
							FaceDev
						</span>
					</a>
					at
					<a href="https://outpoot.com" class="mx-1 text-primary underline">Outpoot</a>. We’re also
					behind Lyntr.
				</p>
				<p>The goal? See chaos. I like chaos.</p>
			</CardContent>
		</Card>
	</div>

	<div class="flex flex-col gap-8">
		<Card>
			<CardHeader>
				<CardTitle class="text-3xl">Attribution & License</CardTitle>
			</CardHeader>
			<CardContent>
				<p>
					Content from Wikipedia (<a
						href="https://creativecommons.org/licenses/by-sa/4.0/"
						class="mx-1 text-primary underline"
					>
						CC BY-SA 4.0
					</a>)
				</p>
				<p>
					© {new Date().getFullYear()}
					<a href="https://outpoot.com" class="mx-1 text-primary underline"> Outpoot </a>
				</p>
			</CardContent>
		</Card>
	</div>
</section>
