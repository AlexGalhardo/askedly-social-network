import { expect, test } from "@playwright/test";
import { waitForCaptcha } from "./helpers";

test("signing up with a new account logs in and redirects to /minha-conta", async ({ page }) => {
	const unique = Date.now();
	const nickname = `e_${unique}`;
	const email = `e2e-${unique}@example.com`;

	await page.goto("/criar-conta");

	await page.locator("#name").fill("E2E Test User");
	await page.locator("#nickname").fill(nickname);
	await page.locator("#email").fill(email);
	await page.locator("#password").fill("Sup3r!Secret");
	await page.locator("#terms").click();

	await waitForCaptcha(page);
	await page.getByRole("button", { name: /criar conta gratuitamente/i }).click();

	await page.waitForURL(/\/minha-conta/, { timeout: 15_000 });
	await expect(page).toHaveURL(/\/minha-conta/);
});
