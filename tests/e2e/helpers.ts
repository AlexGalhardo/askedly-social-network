import { expect, type Page } from "@playwright/test";

/** In CI the e2e runs with `next start` (production), where the captcha is mandatory; waits for Turnstile to issue the token. */
export async function waitForCaptcha(page: Page): Promise<void> {
	if (!process.env.CI) return;
	await expect
		.poll(
			() =>
				page.evaluate(() =>
					Boolean((window as Window & { turnstile?: { getResponse(): string } }).turnstile?.getResponse()),
				),
			{ timeout: 15_000 },
		)
		.toBe(true);
}

/**
 * Each test as a different client: the rate limit (per IP) stays on, but repeated suite runs, and the
 * CI retries, do not exhaust a single IP's signup quota.
 */
export async function useUniqueClientIp(page: Page): Promise<void> {
	const octet = (): number => Math.floor(Math.random() * 254) + 1;
	await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` });
}
