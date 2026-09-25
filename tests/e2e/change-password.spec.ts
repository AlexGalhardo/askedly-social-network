import { expect, test } from "@playwright/test";
import { waitForCaptcha } from "./helpers";

test("changing the password requires the current password", async ({ page }) => {
	const unique = Date.now();
	const nickname = `p_${unique}`;

	await page.goto("/criar-conta");
	await page.locator("#name").fill("E2E Password User");
	await page.locator("#nickname").fill(nickname);
	await page.locator("#email").fill(`pw-${unique}@example.com`);
	await page.locator("#password").fill("Old!Pass123");
	await page.locator("#terms").click();
	await waitForCaptcha(page);
	await page.getByRole("button", { name: /criar conta gratuitamente/i }).click();
	await page.waitForURL(/\/minha-conta/, { timeout: 15_000 });

	const submit = page.getByRole("button", { name: /atualizar senha/i });

	await page.locator("#current-password").fill("Wrong!Pass999");
	await page.locator("#new-password").fill("New!Pass456");
	await page.locator("#confirm-password").fill("New!Pass456");
	await submit.click();
	await expect(page.getByText("Senha atual incorreta", { exact: true })).toBeVisible();

	await page.locator("#current-password").fill("Old!Pass123");
	await submit.click();
	await expect(page.getByText("Sua senha foi atualizada com sucesso!", { exact: true })).toBeVisible();
});
