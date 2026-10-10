import { expect, test } from "@playwright/test";

test("homepage loads and offers a way to sign in", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveTitle(/.+/);
	await expect(page.getByRole("link", { name: /login/i }).first()).toBeVisible();
});

test("login page renders the credentials form", async ({ page }) => {
	await page.goto("/login");
	await expect(page.locator("#email")).toBeVisible();
	await expect(page.locator("#password")).toBeVisible();
});

// Regression: the root layout once rendered {children} twice (one tree per breakpoint),
// duplicating ids, effects and API calls on every page.
test("page content is rendered only once", async ({ page }) => {
	await page.goto("/login");
	await expect(page.locator("main")).toHaveCount(1);
	await expect(page.locator("#email")).toHaveCount(1);
});
