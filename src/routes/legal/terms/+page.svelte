<script lang="ts">
	import { Separator } from '$lib/components/ui/separator';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import ScrollText from 'lucide-svelte/icons/scroll-text';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	const LAST_UPDATED = 'January 20, 2024';
</script>

<svelte:head>
	<title>Terms of Service: Bliptext</title>
	<meta name="description" content="Read the terms of service of Bliptext, the wiki where you edit 1 word each 30 seconds." />
	<meta name="keywords" content="terms, service, agreement, bliptext" />
	<meta property="og:title" content="Terms of Service: Bliptext" />
	<meta property="og:description" content="Read the terms of service of Bliptext, the wiki where you edit 1 word each 30 seconds." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={page.url.href} />
</svelte:head>

<div class="container mx-auto max-w-4xl py-10">
	<Card.Root class="p-6">
		<div class="mb-8 flex items-center gap-3">
			<ScrollText class="h-10 w-10 text-primary" />
			<div>
				<h1 class="text-4xl font-bold">Terms of Service</h1>
				<p class="text-muted-foreground">Last updated: {LAST_UPDATED}</p>
			</div>
		</div>

		<Separator class="my-6" />

		<div class="space-y-8">
			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">1. Account Requirements</h2>
				<ul class="ml-6 list-disc space-y-2 marker:text-primary">
					<li>Valid Discord account required (must comply with Discord's Terms)</li>
					<li>By using BlipText, you confirm you are at least 13 years of age</li>
					<li>Duplicate accounts will result in permanent suspension</li>
					<li>You are solely responsible for account security</li>
				</ul>
			</Card.Content>

			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">2. Content Policy</h2>
				<div class="space-y-4">
					<div>
						<h3 class="mb-2 text-lg font-medium">2.1 Prohibited Content</h3>
						<ul class="ml-6 list-disc space-y-2 marker:text-destructive">
							<li>Adult content, nudity, or sexually explicit material</li>
							<li>Hate speech, harassment, or discriminatory content</li>
							<li>Malicious software, phishing attempts, or spam</li>
							<li>Content violating laws or third-party rights</li>
						</ul>
					</div>

					<div>
						<h3 class="mb-2 text-lg font-medium">2.2 Moderation</h3>
						<ul class="ml-6 list-disc space-y-2 marker:text-primary">
							<li>Content violating these terms will be removed without notice</li>
							<li>Automated content manipulation tools are strictly prohibited</li>
						</ul>
					</div>
				</div>
			</Card.Content>

			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">3. Ownership</h2>
				<ul class="ml-6 list-disc space-y-2 marker:text-primary">
					<li>All BlipText platform rights reserved by the developer</li>
					<li>User-generated content remains creator property</li>
				</ul>
			</Card.Content>

			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">4. Privacy</h2>
				<ul class="ml-6 list-disc space-y-2 marker:text-primary">
					<li>
						Data practices outlined in our <a
							href="https://bliptext.com/privacy"
							class="text-primary hover:underline">Privacy Policy</a
						>
					</li>
					<li>Anonymous usage analytics collected for service improvement</li>
				</ul>
			</Card.Content>

			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">5. Service Management</h2>
				<ul class="ml-6 list-disc space-y-2 marker:text-primary">
					<li>Features may change or be discontinued at any time</li>
					<li>Accounts violating terms subject to immediate termination</li>
					<li>Account deletion available through profile settings</li>
				</ul>
			</Card.Content>

			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">6. Liability</h2>
				<ul class="ml-6 list-disc space-y-2 marker:text-primary">
					<li>Service provided "as is" without guarantees</li>
					<li>Users agree not to hold developer liable for service-related damages</li>
				</ul>
			</Card.Content>

			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">7. Agreement</h2>
				<ul class="ml-6 list-disc space-y-2 marker:text-primary">
					<li>Continued use constitutes acceptance of these terms</li>
					<li>Terms may be updated periodically - check back for changes</li>
					<li>
						Contact: <a
							href="mailto:business.facedev@gmail.com"
							class="text-primary hover:underline">business.facedev@gmail.com</a
						>
					</li>
				</ul>
			</Card.Content>

			<div class="text-sm text-muted-foreground">
				<p>Last Updated: {LAST_UPDATED}</p>
			</div>
		</div>

		<Separator class="my-8" />

		<div class="flex justify-center">
			<Button variant="outline" size="lg" onclick={() => goto('/legal/privacy')}>
				Read our Privacy Policy →
			</Button>
		</div>
	</Card.Root>
</div>
