import { expect, test } from "@playwright/test";

test("signing up with a new account logs in and redirects to /minha-conta", async ({ page }) => {
	const unique = Date.now();
	// O campo de nickname só aceita a-z: dígitos do timestamp viram letras para manter a unicidade.
	const nickname = `e${String(unique).replace(/\d/g, (d) => String.fromCharCode(97 + Number(d)))}`.slice(0, 16);
	const email = `e2e-${unique}@example.com`;

	await page.goto("/criar-conta");

	await page.locator("#name").fill("E2E Test User");
	await page.locator("#nickname").fill(nickname);
	await page.locator("#email").fill(email);
	await page.locator("#password").fill("Sup3r!Secret");
	await page.locator("#terms").click();

	await page.getByRole("button", { name: /criar conta gratuitamente/i }).click();

	await page.waitForURL(/\/minha-conta/, { timeout: 15_000 });
	await expect(page).toHaveURL(/\/minha-conta/);
});
