import { expect, test } from "@playwright/test";

test("homepage loads and offers a way to sign in", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveTitle(/.+/);
	await expect(page.getByRole("link", { name: /entrar/i }).first()).toBeVisible();
});

test("login page renders the credentials form", async ({ page }) => {
	await page.goto("/entrar");
	// app/layout.tsx renders {children} twice (once per responsive breakpoint --
	// see TODO.md Fase 11), so every id on every page is duplicated in the DOM.
	// .first() works around it here; the duplication itself is a flagged finding.
	await expect(page.locator("#email:visible")).toBeVisible();
	await expect(page.locator("#password:visible")).toBeVisible();
});
