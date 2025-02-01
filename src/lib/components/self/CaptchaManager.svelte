<script lang="ts">
	import { Turnstile } from 'svelte-turnstile';
	import { env } from '$env/dynamic/public';
	import { captchaToken, captchaVerified } from '$lib/stores/captcha';
	import { toast } from 'svelte-sonner';

	let showCaptcha = $state(false);
	let captchaError = $state<string | null>(null);

	export function startVerification() {
		showCaptcha = true;
		$captchaVerified = false;
		$captchaToken = null;
	}

	function handleVerified(token: string) {
		$captchaVerified = true;
		$captchaToken = token;
		captchaError = null;
		showCaptcha = false;
	}
</script>

{#if showCaptcha}
	<div class="captcha-overlay">
		<div class="captcha-container">
			<Turnstile
				siteKey={env.PUBLIC_TURNSTILE_SITE_KEY}
				on:callback={({ detail: { token } }) => handleVerified(token)}
				on:error={({ detail: { code } }) => {
					captchaError = `CAPTCHA error: ${code}`;
					$captchaVerified = false;
					toast.error(captchaError);
				}}
				on:expired={() => {
					$captchaVerified = false;
					$captchaToken = null;
					toast.error('CAPTCHA expired. Please verify again.');
				}}
				theme="dark"
				size="normal"
			/>
			<p class="mt-2 text-sm text-muted-foreground">Please verify you're human to continue</p>
		</div>
	</div>
{/if}

<style>
	.captcha-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.captcha-container {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		text-align: center;
	}
</style>
