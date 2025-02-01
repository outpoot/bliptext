import { env } from '$env/dynamic/private';

export async function validateTurnstile(token: string): Promise<boolean> {
	const formData = new FormData();
	formData.append('secret', env.TURNSTILE_SECRET_KEY);
	formData.append('response', token);

	try {
		const response = await fetch(
			'https://challenges.cloudflare.com/turnstile/v0/siteverify',
			{ method: 'POST', body: formData }
		);
		const data = await response.json();
		return data.success;
	} catch (error) {
		console.error('Turnstile validation error:', error);
		return false;
	}
}