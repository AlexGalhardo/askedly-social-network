import { expect, test } from "@playwright/test";

test("homepage loads and offers a way to sign in", async ({ page }) => {
	await page.goto("/");
	await expect(page).toHaveTitle(/.+/);
	await expect(page.getByRole("link", { name: /entrar/i }).first()).toBeVisible();
});

test("login page renders the credentials form", async ({ page }) => {
	await page.goto("/entrar");
	await expect(page.locator("#email")).toBeVisible();
	await expect(page.locator("#password")).toBeVisible();
});

// Regressão: o layout raiz já renderizou {children} duas vezes (uma árvore por breakpoint),
// duplicando ids, efeitos e chamadas de API em todas as páginas.
test("page content is rendered only once", async ({ page }) => {
	await page.goto("/entrar");
	await expect(page.locator("main")).toHaveCount(1);
	await expect(page.locator("#email")).toHaveCount(1);
});
