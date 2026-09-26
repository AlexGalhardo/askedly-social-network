import { expect, type Page, test } from "@playwright/test";
import { useUniqueClientIp, waitForCaptcha } from "./helpers";

test("changing the password requires the current password and ends every session", async ({ page, browser }) => {
	const unique = Date.now();
	const nickname = `p_${unique}`;

	await useUniqueClientIp(page);
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

	// Outro aparelho logado na mesma conta, antes da troca.
	const otherDevice = await browser.newPage();
	await useUniqueClientIp(otherDevice);
	await logIn(otherDevice, `pw-${unique}@example.com`, "Old!Pass123");
	await otherDevice.waitForURL(new RegExp(`/${nickname}$`), { timeout: 15_000 });

	await page.locator("#current-password").fill("Old!Pass123");
	await submit.click();
	await page.waitForURL(/\/entrar\?senha-alterada=1/, { timeout: 15_000 });
	await expect(page.getByText(/todas as sessões foram encerradas/)).toBeVisible();

	// O token do outro aparelho foi emitido antes da troca: deixou de valer.
	await otherDevice.goto("/minha-conta");
	await otherDevice.waitForURL(/\/entrar/, { timeout: 15_000 });
	await otherDevice.close();

	await logIn(page, `pw-${unique}@example.com`, "New!Pass456");
	await page.waitForURL(new RegExp(`/${nickname}$`), { timeout: 15_000 });
});

async function logIn(target: Page, email: string, password: string): Promise<void> {
	await target.goto("/entrar");
	await target.locator("#email").fill(email);
	await target.locator("#password").fill(password);
	await waitForCaptcha(target);
	await target.getByRole("button", { name: "Entrar", exact: true }).click();
}
