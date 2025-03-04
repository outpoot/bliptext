<script lang="ts">
	import { Separator } from "$lib/components/ui/separator";
	import { Button } from "$lib/components/ui/button";
	import * as Card from "$lib/components/ui/card";
	import Shield from "lucide-svelte/icons/shield";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";

	const LAST_UPDATED = "March 4, 2025";
</script>

<svelte:head>
	<title>Privacy Policy: Bliptext</title>
	<meta
		name="description"
		content="Read the privacy policy of Bliptext, the wiki where you edit 1 word each 30 seconds."
	/>
	<meta name="keywords" content="privacy, policy, data, security, bliptext" />
	<meta property="og:title" content="Privacy Policy: Bliptext" />
	<meta
		property="og:description"
		content="Read the privacy policy of Bliptext, the wiki where you edit 1 word each 30 seconds."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content={page.url.href} />
</svelte:head>

<div class="container mx-auto max-w-4xl py-10">
	<Card.Root class="p-6">
		<div class="mb-8 flex items-center gap-3">
			<Shield class="h-10 w-10 text-primary" />
			<div>
				<h1 class="text-4xl font-bold">Privacy Policy</h1>
				<p class="text-muted-foreground">
					Last updated: {LAST_UPDATED}
				</p>
			</div>
		</div>

		<Separator class="my-6" />

		<div class="space-y-8">
			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">
					1. Information We Collect
				</h2>
				<div class="space-y-4">
					<div>
						<h3 class="mb-2 text-lg font-medium">
							1.1 Account Information
						</h3>
						<ul
							class="ml-6 list-disc space-y-2 marker:text-primary"
						>
							<li>
								Basic profile data from your authentication
								provider (name, avatar)
							</li>
							<li>
								Email address from your authentication provider
							</li>
							<li>
								Account creation and modification timestamps
							</li>
							<li>Authentication provider used</li>
						</ul>
					</div>

					<div>
						<h3 class="mb-2 text-lg font-medium">
							1.2 Authentication Data
						</h3>
						<ul
							class="ml-6 list-disc space-y-2 marker:text-primary"
						>
							<li>Login timestamps and provider used</li>
							<li>Last login IP address for security</li>
						</ul>
					</div>

					<div>
						<h3 class="mb-2 text-lg font-medium">
							1.3 Content Data
						</h3>
						<ul
							class="ml-6 list-disc space-y-2 marker:text-primary"
						>
							<li>Article text content and revision history</li>
							<li>Specific word changes and edit positions</li>
							<li>
								Collaboration timestamps and contributor IDs
							</li>
						</ul>
					</div>

					<div>
						<h3 class="mb-2 text-lg font-medium">
							1.3 Technical Data
						</h3>
						<ul
							class="ml-6 list-disc space-y-2 marker:text-primary"
						>
							<li>IP addresses for security monitoring</li>
							<li>Browser/device information (user agent)</li>
							<li>
								Session tokens and authentication timestamps
							</li>
						</ul>
					</div>
				</div>
			</Card.Content>

			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">2. How We Use Data</h2>
				<ul class="ml-6 list-disc space-y-2 marker:text-primary">
					<li>Maintain article revision history and attribution</li>
					<li>Prevent abuse through IP analysis</li>
					<li>Calculate user contribution metrics</li>
					<li>Secure account access through session tracking</li>
					<li>Deliver core editing functionality</li>
				</ul>
			</Card.Content>

			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">3. Data Retention</h2>
				<div class="space-y-4">
					<div>
						<h3 class="mb-2 text-lg font-medium">
							3.1 Active Data
						</h3>
						<ul
							class="ml-6 list-disc space-y-2 marker:text-primary"
						>
							<li>User accounts: Until deletion request</li>
							<li>
								Article content: Indefinitely unless deleted
							</li>
							<li>
								Revision history: Indefinitely unless deleted
							</li>
						</ul>
					</div>

					<div>
						<h3 class="mb-2 text-lg font-medium">
							3.2 Technical Logs
						</h3>
						<ul
							class="ml-6 list-disc space-y-2 marker:text-primary"
						>
							<li>IP addresses: Until expiration</li>
							<li>Auth tokens: Until expiration</li>
							<li>Security logs: Until expiration</li>
						</ul>
					</div>
				</div>
			</Card.Content>

			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">4. Data Sharing</h2>
				<ul class="ml-6 list-disc space-y-2 marker:text-primary">
					<li>No sale of personal information</li>
					<li>Anonymous aggregate statistics may be shared</li>
				</ul>
			</Card.Content>

			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">5. Your Rights</h2>
				<ul class="ml-6 list-disc space-y-2 marker:text-primary">
					<li>Delete personal account information</li>
				</ul>
			</Card.Content>

			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">
					6. Content Responsibility
				</h2>
				<ul class="ml-6 list-disc space-y-2 marker:text-primary">
					<li>
						All content changes are automatically verified and
						filtered
					</li>
					<li>
						Your contributions are subject to our automated
						moderation system
					</li>
					<li>
						We maintain complete edit history and regularly review
						changes
					</li>
					<li>
						Our moderators actively monitor content and revision
						history
					</li>
				</ul>
			</Card.Content>

			<div class="text-sm text-muted-foreground">
				<p>Last Updated: {LAST_UPDATED}</p>
				<p>
					Contact: <a
						href="mailto:contact@outpoot.com"
						class="text-primary hover:underline">contact@outpoot.com</a>
				</p>
			</div>
		</div>

		<Separator class="my-8" />

		<div class="flex justify-center">
			<Button
				variant="outline"
				size="lg"
				onclick={() => goto("/legal/terms")}
			>
				Read our Terms of Service →
			</Button>
		</div>
	</Card.Root>
</div>
