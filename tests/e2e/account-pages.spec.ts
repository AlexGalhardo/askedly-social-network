import { expect, test } from "@playwright/test";
import { useUniqueClientIp, waitForCaptcha } from "./helpers";

// As listas do usuário (perguntas, seguidores, bloqueios, contador da sidebar) deixaram de vir na sessão e passaram
// a ser buscadas por Server Action em cada tela. Este teste garante que todas continuam abrindo sem erro.
test("account pages load their data without errors", async ({ page }) => {
	const errors: string[] = [];
	// O widget do Turnstile com a chave real recusa localhost (erro 110200); é da Cloudflare, não destas telas.
	page.on("pageerror", (error) => {
		if (!error.message.startsWith("[Cloudflare Turnstile]")) errors.push(error.message);
	});

	const unique = Date.now();
	await useUniqueClientIp(page);
	await page.goto("/criar-conta");
	await page.locator("#name").fill("Conta Completa");
	await page.locator("#nickname").fill(`a_${unique}`);
	await page.locator("#email").fill(`account-${unique}@example.com`);
	await page.locator("#password").fill("Sup3r!Secret");
	await page.locator("#terms").click();
	await waitForCaptcha(page);
	await page.getByRole("button", { name: /criar conta gratuitamente/i }).click();
	await page.waitForURL(/\/minha-conta/, { timeout: 15_000 });
	await expect(page.getByText("Usuários Bloqueados")).toBeVisible();

	for (const path of ["/perguntas-recebidas", "/perguntas-enviadas", "/seguidores", "/seguindo", "/"]) {
		await page.goto(path);
		await page.waitForLoadState("networkidle");
		expect(page.url(), `${path} não deveria mandar para o login`).not.toContain("/entrar");
		await expect(page.getByText(/Application error|Unhandled Runtime Error/)).toHaveCount(0);
	}

	expect(errors).toEqual([]);
});
