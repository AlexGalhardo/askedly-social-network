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

/**
 * Cada teste como um cliente diferente: o rate limit (por IP) continua ligado, mas rodadas repetidas da suíte, e os
 * retries do CI, não esgotam a cota de cadastro de um IP só.
 */
export async function useUniqueClientIp(page: Page): Promise<void> {
	const octet = (): number => Math.floor(Math.random() * 254) + 1;
	await page.setExtraHTTPHeaders({ "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` });
}
