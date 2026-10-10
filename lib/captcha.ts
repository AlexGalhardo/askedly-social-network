import TelegramLog from "./telegram-logger";
import { TURNSTILE_ENABLED } from "./turnstile";

// Fail closed: if Cloudflare does not respond, the request does not pass without captcha.
export async function isCaptchaValid(token: string | undefined): Promise<boolean> {
	// Captcha only applies with both keys: without the site key the frontend does not show the widget and there is no token to check.
	// Not configured = feature off. Configured, it fails closed.
	if (!TURNSTILE_ENABLED || !process.env.CLOUDFLARE_TURNSTILE_SECRET) return true;
	if (!token) return false;
	try {
		const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({ secret: process.env.CLOUDFLARE_TURNSTILE_SECRET ?? "", response: token }),
		});
		const data: { success?: boolean } = await res.json();
		return data.success === true;
	} catch (error: unknown) {
		await TelegramLog.error(`Error validating captcha: ${error instanceof Error ? error.message : error}`);
		return false;
	}
}
