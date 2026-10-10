import { expect, test } from "@playwright/test";
import { useUniqueClientIp, waitForCaptcha } from "./helpers";

// The user's lists (questions, followers, blocks, sidebar counter) stopped coming in the session and are now
// fetched by Server Action on each screen. This test makes sure they all still open without errors.
test("account pages load their data without errors", async ({ page }) => {
	const errors: string[] = [];
	// The Turnstile widget with the real key rejects localhost (error 110200); that is Cloudflare's, not these screens'.
	page.on("pageerror", (error) => {
		if (!error.message.startsWith("[Cloudflare Turnstile]")) errors.push(error.message);
	});

	const unique = Date.now();
	await useUniqueClientIp(page);
	await page.goto("/signup");
	await page.locator("#name").fill("Full Account");
	await page.locator("#nickname").fill(`a_${unique}`);
	await page.locator("#email").fill(`account-${unique}@example.com`);
	await page.locator("#password").fill("Sup3r!Secret");
	await page.locator("#terms").click();
	await waitForCaptcha(page);
	await page.getByRole("button", { name: /criar conta gratuitamente/i }).click();
	await page.waitForURL(/\/my-account/, { timeout: 15_000 });
	await expect(page.getByText("Usuários Bloqueados")).toBeVisible();

	for (const path of ["/received-questions", "/sent-questions", "/followers", "/following", "/"]) {
		await page.goto(path);
		await page.waitForLoadState("networkidle");
		expect(page.url(), `${path} should not redirect to login`).not.toContain("/login");
		await expect(page.getByText(/Application error|Unhandled Runtime Error/)).toHaveCount(0);
	}

	expect(errors).toEqual([]);
});
