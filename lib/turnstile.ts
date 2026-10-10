// The site key is public by nature. Without it the captcha is off: the widget does not appear and the forms do not
// require a token (the server does the same when CLOUDFLARE_TURNSTILE_SECRET is missing, see lib/captcha.ts).
// Cloudflare test keys, which always pass: 1x00000000000000000000AA / 1x0000000000000000000000000000000AA.
export const TURNSTILE_SITE_KEY: string = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY ?? "";
export const TURNSTILE_ENABLED: boolean = TURNSTILE_SITE_KEY !== "";

interface TurnstileApi {
	render(container: HTMLElement, options: { sitekey: string }): string;
	getResponse(widgetId?: string): string | undefined;
	reset(widgetId?: string): void;
}

export function getTurnstile(): TurnstileApi | undefined {
	return (window as Window & { turnstile?: TurnstileApi }).turnstile;
}

/**
 * The Turnstile token is single-use. When a flow needs two (signup, then login), resets the widget and
 * waits for the new one. Null if it does not arrive in time (e.g. Cloudflare asked for interaction).
 */
export async function waitForFreshTurnstileToken(timeoutMs = 15_000): Promise<string | null> {
	const turnstile = getTurnstile();
	if (!turnstile) return null;
	turnstile.reset();
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		const token = turnstile.getResponse();
		if (token) return token;
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
	return null;
}
