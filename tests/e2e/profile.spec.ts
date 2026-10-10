import { expect, test } from "@playwright/test";
import { useUniqueClientIp, waitForCaptcha } from "./helpers";

test("a public profile renders for its owner and for an anonymous visitor", async ({ page, browser }) => {
	const unique = Date.now();
	const nickname = `v_${unique}`;

	await useUniqueClientIp(page);
	await page.goto("/signup");
	await page.locator("#name").fill("Perfil Visitado");
	await page.locator("#nickname").fill(nickname);
	await page.locator("#email").fill(`profile-${unique}@example.com`);
	await page.locator("#password").fill("Sup3r!Secret");
	await page.locator("#terms").click();
	await waitForCaptcha(page);
	await page.getByRole("button", { name: /criar conta gratuitamente/i }).click();
	await page.waitForURL(/\/my-account/, { timeout: 15_000 });

	await page.goto(`/${nickname}`);
	await expect(page.getByRole("heading", { name: "Perfil Visitado" })).toBeVisible();

	// A visitor without a session receives the profile already filtered by the server (skeletons in place of the content).
	const visitor = await browser.newPage();
	await visitor.goto(`/${nickname}`);
	await expect(visitor.getByRole("heading", { name: "Perfil Visitado" })).toBeVisible();
	await visitor.close();
});
