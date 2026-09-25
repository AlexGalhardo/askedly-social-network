import { expect, type Page } from "@playwright/test";

/** No CI o e2e roda com `next start` (produção), onde o captcha é obrigatório; espera o Turnstile emitir o token. */
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
