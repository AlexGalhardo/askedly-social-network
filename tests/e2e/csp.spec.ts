import { expect, test } from "@playwright/test";
import { useUniqueClientIp, waitForCaptcha } from "./helpers";

// Com CSP estrito, qualquer script/origem esquecido quebra a página em silêncio. Este teste percorre as telas
// principais e falha em qualquer violação (lista de origens em lib/csp.ts).
test("pages run under the nonce CSP without violations", async ({ page, request }) => {
	await page.addInitScript(() => {
		const store = window as unknown as { __cspViolations: string[] };
		store.__cspViolations = [];
		document.addEventListener("securitypolicyviolation", (event) => {
			store.__cspViolations.push(`${event.violatedDirective} ${event.blockedURI}`);
		});
	});

	const first = (await request.get("/")).headers()["content-security-policy"] ?? "";
	const second = (await request.get("/")).headers()["content-security-policy"] ?? "";
	const nonceOf = (csp: string): string | undefined => csp.match(/'nonce-([^']+)'/)?.[1];
	expect(nonceOf(first)).toBeTruthy();
	expect(nonceOf(first)).not.toBe(nonceOf(second));

	const unique = Date.now();
	await useUniqueClientIp(page);
	await page.goto("/criar-conta");
	await page.locator("#name").fill("Conta CSP");
	await page.locator("#nickname").fill(`c_${unique}`);
	await page.locator("#email").fill(`csp-${unique}@example.com`);
	await page.locator("#password").fill("Sup3r!Secret");
	await page.locator("#terms").click();
	await waitForCaptcha(page);
	const violations: string[] = (
		await page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations)
	).map((v) => `/criar-conta: ${v}`);
	await page.getByRole("button", { name: /criar conta gratuitamente/i }).click();
	await page.waitForURL(/\/minha-conta/, { timeout: 15_000 });

	for (const path of [
		"/minha-conta",
		"/",
		"/top-curtidas",
		`/c_${unique}`,
		"/perguntas-recebidas",
		"/contato",
		"/sobre",
	]) {
		await page.goto(path);
		await page.waitForTimeout(1500);
		const found = await page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations);
		violations.push(...found.map((v) => `${path}: ${v}`));
	}

	expect(violations).toEqual([]);
});
