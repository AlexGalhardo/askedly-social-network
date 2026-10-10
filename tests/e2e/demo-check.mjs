// Checagem manual do modo demonstração (docs/docker.md):
//   node tests/e2e/demo-check.mjs http://localhost:3000 <id de um usuário> <nickname dele>
// Para pegar um usuário: docker compose -f infra/docker-compose.demo.yaml exec db \n//   psql -U postgres -d askedly_demo -Atc "select id, nickname from users where not is_admin limit 1"
// Não entra na suíte do Playwright (não é *.spec.ts): precisa da stack Docker de demonstração no ar.
import { chromium } from "@playwright/test";

const [base = "http://localhost:3000", ownerId, nickname] = process.argv.slice(2);
if (!ownerId || !nickname) {
	console.error("Uso: node tests/e2e/demo-check.mjs <url> <id do usuário> <nickname>");
	process.exit(1);
}
const results = [];
const check = (name, ok, detail = "") => {
	results.push(ok);
	console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` (${detail})` : ""}`);
};

for (const [locale, lang] of [
	["en-US", "en"],
	["pt-BR", "pt"],
	["es-MX", "es"],
]) {
	const html = await (await fetch(`${base}/entrar`, { headers: { "accept-language": locale } })).text();
	check(`html lang for ${locale}`, html.includes(`<html lang="${lang}"`), html.match(/<title>([^<]*)/)?.[1]);
}
check("health", (await fetch(`${base}/api/health`)).status === 200);
check("admin is 404 when logged out", (await fetch(`${base}/admin`)).status === 404);
check(
	"stripe webhook rejects unsigned",
	(await fetch(`${base}/api/webhook/stripe`, { method: "POST" })).status === 400,
);

const browser = await chromium.launch();
const page = await (await browser.newContext({ locale: "en-US" })).newPage();
const cspViolations = [];
page.on("console", (message) => {
	if (message.text().includes("Content Security Policy")) cspViolations.push(message.text());
});
const api = async (path, body) =>
	page.evaluate(
		async ([url, payload]) => {
			const response = await fetch(url, {
				method: payload ? "POST" : "GET",
				headers: { "Content-Type": "application/json" },
				body: payload ? JSON.stringify(payload) : undefined,
			});
			return { status: response.status, body: await response.json().catch(() => null) };
		},
		[path, body],
	);

try {
	await page.goto(`${base}/entrar`);
	await page.fill("#email", "admin@gmail.com");
	await page.fill("#password", "adminBR@123");
	await page.waitForFunction(() => Boolean(window.turnstile?.getResponse()), null, { timeout: 20_000 });
	await page.click('button[type="submit"]');
	await page.waitForURL((url) => !url.pathname.startsWith("/entrar"), { timeout: 20_000 });
	check("admin login", true);

	await page.goto(`${base}/admin`);
	check("admin dashboard renders in English", (await page.textContent("h1"))?.includes("Admin dashboard") === true);

	const before = (await api("/api/stripe/connect")).body;
	check("credits and payout status", before.payoutStatus === "active", JSON.stringify(before));

	const checkout = await api("/api/stripe/checkout", { amount: 1000 });
	const afterPurchase = (await api("/api/stripe/connect")).body;
	check("simulated credit purchase adds $10", afterPurchase.credits === before.credits + 1000, checkout.body?.url);

	const question = {
		question_text: "Demo check: does the simulated payment flow work end to end?",
		owner_user_id: ownerId,
	};

	const self = await api("/api/question/create-with-credits", { ...question, owner_user_id: "self", amount: 200 });
	check("credit question to unknown owner is rejected", self.status === 404, String(self.status));

	const paid = await api("/api/question/create-with-credits", { ...question, amount: 500 });
	const afterQuestion = (await api("/api/stripe/connect")).body;
	check(
		`credit question to @${nickname} debits $5`,
		paid.status === 201 && afterQuestion.credits === afterPurchase.credits - 500,
		`${paid.status} ${JSON.stringify(paid.body?.error ?? "")}`,
	);

	const tooMuch = await api("/api/question/create-with-credits", { ...question, amount: 100_000 });
	check("credit question above balance is rejected", tooMuch.status === 400, String(tooMuch.status));

	const pix = await api("/api/pix/create", { amount: 500, nickname });
	const pixStatus = await api(`/api/pix/check?id=${pix.body?.id}`);
	const pixQuestion = await api("/api/question/create", { ...question, pix_id: pix.body?.id });
	check(
		"simulated PIX is confirmed and creates the question",
		pixStatus.body?.status === "PAID" && pixQuestion.status === 201,
	);

	check("no CSP violations", cspViolations.length === 0, cspViolations[0]);
} catch (error) {
	check("browser flow", false, error instanceof Error ? error.message.split("\n")[0] : String(error));
} finally {
	await browser.close();
}

process.exit(results.every(Boolean) ? 0 : 1);
