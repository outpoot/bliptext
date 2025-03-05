<script lang="ts">
	import { Separator } from "$lib/components/ui/separator";
	import { Button } from "$lib/components/ui/button";
	import * as Card from "$lib/components/ui/card";
	import Shield from "lucide-svelte/icons/shield";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";

	const LAST_UPDATED = "March 5, 2025";
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

		<Card.Content>
			<h2 class="mb-4 text-2xl font-semibold">Scope of This Policy</h2>
			<p>
				This service is operated by Bliptext. We serve an international
				audience. Data is processed on servers located in the United
				States, and our content and services are available to users
				worldwide.
			</p>
		</Card.Content>

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
						<p class="mt-2 text-sm">
							Usernames and profile data are directly sourced from
							your authentication provider (e.g., Google,
							Discord). We do not allow edits to this information
							to preserve attribution integrity. To update your
							username or email, modify them via your
							authentication provider account.
						</p>
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
				<p>We process personal data to:</p>
				<ul class="ml-6 list-disc space-y-2 marker:text-primary">
					<li>
						Fulfill contractual obligations (e.g., delivering core
						editing functionality, maintaining revision history).
					</li>
					<li>
						Pursue legitimate business interests (e.g., preventing
						abuse through IP analysis, securing accounts).
					</li>
					<li>
						Comply with legal requirements (e.g., retaining logs for
						security investigations).
					</li>
				</ul>
				<p class="mt-4 text-sm text-muted-foreground">
					All data processing is carried out on a lawful basis (e.g.,
					consent, contract necessity, legitimate interest as
					applicable under GDPR).
				</p>
			</Card.Content>

			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">
					Lawful Basis for Processing
				</h2>
				<p>We process data under:</p>
				<ul class="ml-6 list-disc space-y-2 marker:text-primary">
					<li>
						<strong>Contractual necessity</strong>: To provide wiki
						editing functionality
					</li>
					<li>
						<strong>Legitimate interests</strong>: Security
						monitoring, abuse prevention
					</li>
					<li>
						<strong>Legal obligations</strong>: Responding to lawful
						requests
					</li>
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
							<li>User accounts: Deleted upon request</li>
							<li>
								Article edit history: Retained indefinitely for
								content integrity
							</li>
						</ul>
					</div>

					<div>
						<h3 class="mb-2 text-lg font-medium">
							3.2 Technical Logs & Tokens
						</h3>
						<ul
							class="ml-6 list-disc space-y-2 marker:text-primary"
						>
							<li>
								IP logs: Automatically deleted after 90 days
							</li>
							<li>
								Session tokens: Expire as defined by our system
								(e.g., after 30 days of inactivity).
							</li>
							<li>
								Auth tokens: Expire at the configured timestamp
							</li>
							<li>
								Verification tokens: Retained until their
								designated expiration time.
							</li>
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
				<p>You have the right to:</p>
				<ul class="ml-6 list-disc space-y-2 marker:text-primary">
					<li>Request deletion of your personal data</li>
				</ul>
				<p class="mt-2">For EU users, additionally you may:</p>
				<ul class="ml-6 list-disc space-y-2 marker:text-primary">
					<li>
						Request data correction: If your authentication provider
						data (e.g., email) is inaccurate, update it directly via
						your provider.
					</li>
					<li>
						Access personal data: For a copy of your processed data,
						please contact <a
							href="mailto:privacy@outpoot.com"
							class="text-primary hover:underline"
							target="_blank">privacy@outpoot.com</a
						>.
					</li>
					<li>
						Delete account: Removes all personal data except
						anonymized edit history (required for public interest).
					</li>
					<li>
						File complaints with EU authorities; find yours <a
							href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
							class="text-primary hover:underline"
							target="_blank">here</a
						>.
					</li>
				</ul>
				<p class="mt-2">
					Contact <a
						href="mailto:contact@outpoot.com"
						class="text-primary hover:underline"
						target="_blank">privacy@outpoot.com</a
					> to exercise these rights.
				</p>
			</Card.Content>

			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">Public Interest</h2>
				<p>
					User contributions (usernames, edits) are retained
					indefinitely under GDPR Article 17(3)(d) for archival
					purposes in the public interest. Attribution integrity is
					critical to maintaining a trustworthy collaborative
					platform.
				</p>
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

			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">
					Historical Content Integrity
				</h2>
				<p>To maintain wiki integrity, account deletion will:</p>
				<ul class="ml-6 list-disc space-y-2 marker:text-primary">
					<li>Remove all personal identifiers (email, username)</li>
					<li>Retain anonymized edit history via user IDs</li>
					<li>Preserve article creation credits</li>
				</ul>
				<p class="mt-2">
					We retain this non-personal data under GDPR Article 17(3)(a)
					- freedom of expression/information.
				</p>
			</Card.Content>

			<Card.Content>
				<h2 class="mb-4 text-2xl font-semibold">
					7. International Data Transfers
				</h2>
				<p>
					Data is stored in the United States using GDPR-approved
					safeguards including Standard Contractual Clauses.
				</p>
			</Card.Content>

			<div class="text-sm text-muted-foreground">
				<p>Last Updated: {LAST_UPDATED}</p>
				<p>
					Contact: <a
						href="mailto:contact@outpoot.com"
						class="text-primary hover:underline"
						>contact@outpoot.com</a
					>
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
