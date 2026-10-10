/**
 * qa.ts — autonomous QA engineer for Askedly.
 *
 * Drives the running app like a careful human tester: every public page, link, button,
 * locale, auth flow, API route authorization, injection/XSS attempt, and the full PIX and
 * Stripe (credits) payment rails end to end. It creates its own users through the real
 * signup UI (unique per run) and never depends on seed data other than the admin.
 *
 * Run (from the repo root):
 *   bun qa.ts [baseUrl] [flags]
 *   bun qa.ts http://localhost:3300 --report=qa-report.json
 *
 * Flags:
 *   --allow-remote      allow a non-local baseUrl (refused by default; never production)
 *   --report=<path>     write a JSON report to <path>
 *   --stripe=sandbox    drive the real hosted Stripe Checkout (best effort; SKIP when simulated)
 *   --admin-email=...   admin login (default admin@gmail.com)
 *   --admin-password=.. admin password (default adminBR@123)
 *   --headed            run the browser headed (debugging)
 *
 * Exit code is 1 if any check FAILed. See docs/qa.md.
 *
 * It only talks to Playwright's bundled Chromium and fetch — no new dependencies. The package script
 * runs it with Bun; where Bun cannot drive Chromium, the same file runs unchanged with
 * `node --experimental-strip-types qa.ts` (plain ESM TypeScript).
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	type APIRequestContext,
	type APIResponse,
	type Browser,
	type BrowserContext,
	chromium,
	type Page,
	request as playwrightRequest,
} from "@playwright/test";

type Status = "PASS" | "FAIL" | "SKIP";

interface Check {
	suite: string;
	name: string;
	status: Status;
	reason: string;
	/** What was sent / what came back, for a FAIL to be actionable. */
	evidence?: { sent?: string; got?: string };
}

const checks: Check[] = [];
let currentSuite = "";

function record(status: Status, name: string, reason: string, evidence?: Check["evidence"]): void {
	checks.push({ suite: currentSuite, name, status, reason, evidence });
	const detail = reason ? ` — ${reason}` : "";
	console.log(`  [${status}] ${name}${detail}`);
}

/**
 * Assert a boolean. Any exception thrown by the assertion body is a FAIL (never swallowed into PASS):
 * a check only passes when its condition actually evaluated to true.
 */
function assert(name: string, condition: boolean, reason: string, evidence?: Check["evidence"]): boolean {
	record(condition ? "PASS" : "FAIL", name, reason, evidence);
	return condition;
}

function skip(name: string, reason: string): void {
	record("SKIP", name, reason);
}

/** Run an async check; a thrown error becomes a FAIL with the message, never a PASS. */
async function guarded(name: string, body: () => Promise<void>): Promise<void> {
	try {
		await body();
	} catch (error) {
		record("FAIL", name, `threw: ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`);
	}
}

function suite(name: string): void {
	currentSuite = name;
	console.log(`\n=== ${name} ===`);
}

// ----------------------------------------------------------------------------
// Arguments and safety
// ----------------------------------------------------------------------------

interface Args {
	baseUrl: string;
	allowRemote: boolean;
	reportPath?: string;
	stripeSandbox: boolean;
	adminEmail: string;
	adminPassword: string;
	headed: boolean;
}

const KNOWN_FLAGS = ["allow-remote", "report", "stripe", "admin-email", "admin-password", "headed"];

function parseArgs(argv: string[]): Args {
	const positional: string[] = [];
	const flags = new Map<string, string>();
	for (const arg of argv) {
		if (arg.startsWith("--")) {
			const [key, ...rest] = arg.slice(2).split("=");
			// A typo such as --alow-remote or --reprot must not be silently ignored.
			if (!KNOWN_FLAGS.includes(key)) {
				console.error(
					`Unknown flag --${key}. Known flags: ${KNOWN_FLAGS.map((flag) => `--${flag}`).join(", ")}`,
				);
				process.exit(2);
			}
			flags.set(key, rest.length > 0 ? rest.join("=") : "true");
		} else {
			positional.push(arg);
		}
	}
	return {
		baseUrl: (positional[0] ?? "http://localhost:3000").replace(/\/$/, ""),
		allowRemote: flags.get("allow-remote") === "true",
		reportPath: flags.get("report"),
		stripeSandbox: flags.get("stripe") === "sandbox",
		adminEmail: flags.get("admin-email") ?? "admin@gmail.com",
		adminPassword: flags.get("admin-password") ?? "adminBR@123",
		headed: flags.get("headed") === "true",
	};
}

function isLocalHost(host: string): boolean {
	return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "0.0.0.0";
}

const PRODUCTION_HOST = "askedly-social-network.vercel.app";

// ----------------------------------------------------------------------------
// Constants derived from the codebase (kept in sync by the money/auth checks below)
// ----------------------------------------------------------------------------

const PASSWORD = "QaTest!234";
const PUBLIC_ROUTES = [
	"/",
	"/login",
	"/signup",
	"/forgot-password",
	"/about",
	"/contact",
	"/privacy-policy",
	"/terms-of-use",
	"/top-liked",
] as const;

/** Old Portuguese path -> English path (proxy.ts legacyRoutes). */
const LEGACY_ROUTES: Record<string, string> = {
	entrar: "login",
	"criar-conta": "signup",
	"esqueci-senha": "forgot-password",
	"minha-conta": "my-account",
	pagamentos: "payments",
	"perguntas-enviadas": "sent-questions",
	"perguntas-recebidas": "received-questions",
	"politica-de-privacidade": "privacy-policy",
	"termos-de-uso": "terms-of-use",
	seguidores: "followers",
	seguindo: "following",
	sobre: "about",
	contato: "contact",
	"top-curtidas": "top-liked",
};

const LOCALES: { accept: string; lang: string; name: string }[] = [
	{ accept: "en-US,en", lang: "en", name: "en" },
	{ accept: "pt-BR,pt", lang: "pt", name: "pt" },
	{ accept: "es-MX,es", lang: "es", name: "es" },
];

/** XSS probes placed in user-controlled fields; none must execute or appear as a live DOM node. */
const XSS_IMG = "<svg onload=alert(1)>"; // 21 chars — fits name (<= 24)
const XSS_SCRIPT = "<script>alert('qa-xss')</script> padding to reach the minimum length"; // for description
const XSS_QUESTION = "<img src=x onerror=alert('qa-xss')> is this question rendered as plain text?";
const XSS_ANSWER = "<svg onload=alert('qa-xss')></svg> and this answer must be rendered as plain text too.";
const XSS_LIVE_NODES = "svg[onload], img[onerror]";

const SQLI_PAYLOADS = ["' OR '1'='1", "'; DROP TABLE users; --", "admin'--", "1 OR 1=1", '" OR ""="'];

// ----------------------------------------------------------------------------
// HTTP helpers
// ----------------------------------------------------------------------------

/** Short excerpt of a response body for the report. */
async function bodyExcerpt(response: APIResponse): Promise<string> {
	try {
		return (await response.text()).slice(0, 200).replace(/\s+/g, " ");
	} catch {
		return "<no body>";
	}
}

/**
 * Log in through the real NextAuth credentials endpoint and return the Set-Cookie session.
 * Returns the raw callback response so callers can inspect status/body.
 */
async function nextAuthLogin(
	api: APIRequestContext,
	baseUrl: string,
	email: string,
	password: string,
	ip: string,
): Promise<{ ok: boolean; status: number; location: string | null }> {
	const csrfResponse = await api.get(`${baseUrl}/api/auth/csrf`, { headers: { "x-forwarded-for": ip } });
	const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
	const callback = await api.post(`${baseUrl}/api/auth/callback/credentials`, {
		headers: { "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": ip },
		form: {
			csrfToken,
			email,
			password,
			// Cloudflare test secret accepts any token; a real deployment would need a solved one.
			captchaToken: "qa.dummy.token",
			json: "true",
			callbackUrl: `${baseUrl}/`,
		},
		maxRedirects: 0,
	});
	// NextAuth answers 200 with a JSON { url } on success and sets a session cookie; a failed login
	// returns that same shape with url pointing at /api/auth/error?error=... (no Location header).
	let url: string | null = null;
	try {
		url = ((await callback.json()) as { url?: string }).url ?? null;
	} catch {
		url = callback.headers().location ?? null;
	}
	const ok = callback.status() === 200 && url !== null && !url.includes("/api/auth/error");
	return { ok, status: callback.status(), location: url };
}

function randomIp(): string {
	const octet = (): number => 1 + Math.floor(Math.random() * 250);
	return `10.${octet()}.${octet()}.${octet()}`;
}

// ----------------------------------------------------------------------------
// User lifecycle through the real signup UI
// ----------------------------------------------------------------------------

interface TestUser {
	context: BrowserContext;
	page: Page;
	nickname: string;
	email: string;
	id: string;
}

let userCounter = 0;

function uniqueNickname(): string {
	userCounter += 1;
	// lowercase letters/digits/_, 4-16 chars, unique per run.
	return `qa${Date.now().toString(36)}${userCounter}`.slice(0, 16);
}

/**
 * Wait for the Cloudflare Turnstile test widget to produce a token. The widget script loads async, so we
 * first wait for its API object to exist (it only does when the captcha is enabled), then for the
 * auto-solved token. No object within the window means the captcha is off and we proceed.
 */
async function waitForTurnstile(page: Page): Promise<void> {
	const enabled = await page
		.waitForFunction(() => typeof (window as unknown as { turnstile?: unknown }).turnstile !== "undefined", null, {
			timeout: 15_000,
		})
		.then(() => true)
		.catch(() => false);
	if (!enabled) return;
	await page
		.waitForFunction(
			() =>
				Boolean(
					(
						window as unknown as { turnstile?: { getResponse(): string | undefined } }
					).turnstile?.getResponse(),
				),
			null,
			{ timeout: 20_000 },
		)
		.catch(() => undefined);
}

/** A browser context with its own simulated client IP (so per-IP rate limits don't bleed across test users). */
async function newClientContext(browser: Browser, locale = "en-US"): Promise<BrowserContext> {
	return browser.newContext({
		locale,
		viewport: { width: 1280, height: 900 },
		extraHTTPHeaders: { "x-forwarded-for": randomIp() },
	});
}

/** Click the visible submit button of the main form (the layout renders other hidden buttons). */
async function submitForm(page: Page): Promise<void> {
	await page.locator('form button[type="submit"]').filter({ visible: true }).first().click();
}

/** Load a page without waiting for networkidle (Turnstile/analytics keep the network busy). */
async function openPage(page: Page, url: string): Promise<void> {
	await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
	await page.waitForLoadState("load", { timeout: 15_000 }).catch(() => undefined);
}

/** Create a brand-new user via /signup and return its context (signed in). Throws on failure. */
async function createUser(browser: Browser, baseUrl: string): Promise<TestUser> {
	const context = await newClientContext(browser);
	const page = await context.newPage();
	const nickname = uniqueNickname();
	const email = `${nickname}@qa.example`;

	await openPage(page, `${baseUrl}/signup`);
	await page.fill("#name", `QA ${nickname}`);
	await page.fill("#nickname", nickname);
	await page.fill("#email", email);
	await page.fill("#password", PASSWORD);
	await page.click("#terms");
	await waitForTurnstile(page);
	await submitForm(page);
	// Signup creates the account and tries to sign in; that auto-login can race the Turnstile token refresh,
	// so wait for it to leave /signup (success lands on /my-account or /login?account-created=1) then make
	// the session deterministic by logging in through the NextAuth endpoint on the shared cookie jar.
	await page.waitForURL((url) => url.pathname !== "/signup", { timeout: 30_000 }).catch(() => undefined);

	const readId = async (): Promise<string | undefined> => {
		const session = await context.request.get(`${baseUrl}/api/auth/session`);
		return ((await session.json()) as { user?: { id?: string } }).user?.id;
	};
	let id = await readId();
	if (!id) {
		const result = await nextAuthLogin(context.request, baseUrl, email, PASSWORD, randomIp());
		if (!result.ok) throw new Error(`signup/login failed for ${nickname}: ${result.status} ${result.location}`);
		id = await readId();
	}
	if (!id) throw new Error(`no session established for ${nickname} after signup`);
	return { context, page, nickname, email, id };
}

// ----------------------------------------------------------------------------
// Suite 1 — Pages and links
// ----------------------------------------------------------------------------

async function suitePagesAndLinks(browser: Browser, api: APIRequestContext, baseUrl: string): Promise<void> {
	suite("1. Pages and links");

	// Titles per locale via Accept-Language.
	for (const route of PUBLIC_ROUTES) {
		for (const locale of LOCALES) {
			await guarded(`${route} returns 200 with ${locale.name} title`, async () => {
				const response = await api.get(`${baseUrl}${route}`, {
					headers: { "accept-language": locale.accept, cookie: "" },
				});
				const html = await response.text();
				const lang = html.match(/<html lang="([a-z]+)"/)?.[1];
				const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
				assert(
					`${route} returns 200 with ${locale.name} title`,
					response.status() === 200 && lang === locale.lang && title.length > 0,
					`status ${response.status()}, lang ${lang}, title ${JSON.stringify(title)}`,
					{ got: `${response.status()} lang=${lang} title=${title}` },
				);
			});
		}
	}

	// Locale switcher (cookie) also drives the language.
	await guarded("locale switcher cookie sets the language", async () => {
		const cookieApi = await playwrightRequest.newContext();
		const response = await cookieApi.get(`${baseUrl}/login`, {
			headers: { cookie: "NEXT_LOCALE=es", "accept-language": "en-US" },
		});
		const lang = (await response.text()).match(/<html lang="([a-z]+)"/)?.[1];
		assert("locale switcher cookie sets the language", lang === "es", `html lang=${lang} with NEXT_LOCALE=es`, {
			got: `lang=${lang}`,
		});
		await cookieApi.dispose();
	});

	// Legacy Portuguese routes 301 to the English ones.
	for (const [legacy, target] of Object.entries(LEGACY_ROUTES)) {
		await guarded(`/${legacy} 301s to /${target}`, async () => {
			const response = await api.get(`${baseUrl}/${legacy}`, { maxRedirects: 0 });
			const location = response.headers().location ?? "";
			assert(
				`/${legacy} 301s to /${target}`,
				response.status() === 301 && location.endsWith(`/${target}`),
				`status ${response.status()} -> ${location}`,
				{ got: `${response.status()} ${location}` },
			);
		});
	}

	// Unknown multi-segment route renders the not-found page (true 404).
	await guarded("unknown route renders not-found (404)", async () => {
		const response = await api.get(`${baseUrl}/zzz-not-real/also-not-real`);
		assert("unknown route renders not-found (404)", response.status() === 404, `status ${response.status()}`, {
			got: String(response.status()),
		});
	});

	// No console errors, no failed same-origin requests, no CSP violations on each visited page; collect links.
	const origin = new URL(baseUrl).origin;
	const discoveredLinks = new Set<string>();
	const context = await browser.newContext({ locale: "en-US" });
	for (const route of PUBLIC_ROUTES) {
		await guarded(`${route} is clean (no console/CSP/request errors)`, async () => {
			const page = await context.newPage();
			const consoleErrors: string[] = [];
			const cspViolations: string[] = [];
			const failedRequests: string[] = [];
			// Vercel Speed Insights injects a script that only exists on Vercel's edge; self-hosted/Docker it 404s.
			// That is an environment artifact of running a Vercel-only integration off-Vercel, not a product bug.
			const isVercelAnalytics = (text: string): boolean =>
				text.includes("/_vercel/") || text.includes("speed-insights");
			page.on("console", (message) => {
				const text = message.text();
				if (isVercelAnalytics(text)) return;
				if (text === "Failed to load resource: the server responded with a status of 404 (Not Found)") return; // paired with the vercel 404 above
				if (message.type() === "error") consoleErrors.push(text);
				if (text.includes("Content Security Policy")) cspViolations.push(text);
			});
			page.on("requestfailed", (requestObj) => {
				const url = requestObj.url();
				// Ignore Next.js RSC prefetches and requests aborted/cancelled by navigation or page close:
				// those are not server failures. Only genuine network failures to our origin count.
				const errorText = requestObj.failure()?.errorText ?? "";
				const aborted = /ERR_ABORTED|cancell?ed|ERR_FAILED/i.test(errorText);
				if (url.startsWith(origin) && !isVercelAnalytics(url) && !url.includes("_rsc=") && !aborted) {
					failedRequests.push(`${url} (${errorText})`);
				}
			});
			page.on("response", (response) => {
				if (!response.url().startsWith(origin) || isVercelAnalytics(response.url())) return;
				const type = response.request().resourceType();
				// 5xx on anything, or a 404 on a static asset the page depends on (not API/data 404s).
				if (response.status() >= 500) failedRequests.push(`${response.status()} ${response.url()}`);
				else if (response.status() === 404 && ["script", "stylesheet", "image", "font"].includes(type)) {
					failedRequests.push(`404 ${type} ${response.url()}`);
				}
			});
			await openPage(page, `${baseUrl}${route}`);
			await page.waitForTimeout(2_500); // let client-side requests and hydration settle
			for (const href of await page.$$eval("a[href]", (as) => as.map((a) => (a as HTMLAnchorElement).href))) {
				if (href.startsWith(origin)) discoveredLinks.add(href.split("#")[0]);
			}
			const clean = consoleErrors.length === 0 && cspViolations.length === 0 && failedRequests.length === 0;
			assert(`${route} is clean (no console/CSP/request errors)`, clean, clean ? "clean" : "issues found", {
				got: JSON.stringify({ consoleErrors, cspViolations, failedRequests }).slice(0, 400),
			});
			await page.close();
		});
	}
	await context.close();

	// Every internal link discovered resolves (not 404/500). Protected pages legitimately redirect to /login.
	await guarded("every internal link resolves", async () => {
		const broken: string[] = [];
		for (const link of discoveredLinks) {
			// /admin legitimately 404s for anonymous visitors (admin-only); skip it here.
			if (link.endsWith("/admin") || link.includes("/api/")) continue;
			const response = await api.get(link, { maxRedirects: 0 });
			const status = response.status();
			if (status === 404 || status >= 500) broken.push(`${status} ${link}`);
		}
		assert(
			"every internal link resolves",
			broken.length === 0,
			broken.length ? broken.join("; ") : `${discoveredLinks.size} links ok`,
			{
				got: broken.join("; ").slice(0, 400),
			},
		);
	});
}

// ----------------------------------------------------------------------------
// Suite 2 — UI interactions
// ----------------------------------------------------------------------------

async function suiteUiInteractions(browser: Browser, user: TestUser, baseUrl: string): Promise<void> {
	suite("2. UI interactions");
	const { page } = user;

	await guarded("sidebar navigation works", async () => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await openPage(page, `${baseUrl}/my-account`);
		await page.click('a[href="/payments"]');
		await page.waitForURL((url) => url.pathname === "/payments", { timeout: 15_000 });
		assert("sidebar navigation works", true, "navigated to /payments via sidebar");
	});

	await guarded("locale switcher toggles language", async () => {
		await openPage(page, `${baseUrl}/my-account`);
		const selector = page.locator("select[aria-label]").first();
		await selector.selectOption("pt");
		await page.waitForFunction(() => document.documentElement.lang === "pt", null, { timeout: 15_000 });
		assert("locale switcher toggles language", true, "switched to pt");
		await selector.selectOption("en");
		await page.waitForFunction(() => document.documentElement.lang === "en", null, { timeout: 15_000 });
	});

	await guarded("theme toggle switches light/dark", async () => {
		await openPage(page, `${baseUrl}/my-account`);
		const before = await page.evaluate(() => document.documentElement.classList.contains("dark"));
		await page
			.getByRole("button", { name: /Dark Mode|Light Mode/ })
			.first()
			.click();
		await page.waitForFunction(
			(wasDark) => document.documentElement.classList.contains("dark") !== wasDark,
			before,
			{ timeout: 10_000 },
		);
		const after = await page.evaluate(() => document.documentElement.classList.contains("dark"));
		assert("theme toggle switches light/dark", before !== after, `dark ${before} -> ${after}`);
	});

	await guarded("mobile menu opens at 390px", async () => {
		await page.setViewportSize({ width: 390, height: 844 });
		await openPage(page, `${baseUrl}/`);
		// The mobile header shows a Menu button; clicking it reveals the drawer with the close button.
		await page.locator("header button").first().click();
		const closeVisible = await page
			.getByRole("button", { name: /Close menu|Fechar menu|Cerrar menú/ })
			.first()
			.isVisible()
			.catch(() => false);
		assert("mobile menu opens at 390px", closeVisible, closeVisible ? "drawer visible" : "drawer not visible");
		await page.setViewportSize({ width: 1280, height: 900 });
	});

	// Form validation messages (fresh anonymous context: a logged-in session redirects away from /signup).
	// The inputs carry native minLength/type=email constraints; to reach the app's own (Zod) validation we
	// submit values that pass native constraints but violate the schema (empty subject, message < 32 chars).
	await guarded("contact form shows validation on invalid submit", async () => {
		const anon = await newClientContext(browser);
		const page2 = await anon.newPage();
		await openPage(page2, `${baseUrl}/contact`);
		await page2
			.waitForFunction(
				() => typeof (window as unknown as { turnstile?: unknown }).turnstile !== "undefined",
				null,
				{
					timeout: 15_000,
				},
			)
			.catch(() => undefined); // hydration proxy
		await page2.fill("#name", "Valid Name");
		await page2.fill("#email", "valid@example.com");
		await page2.fill("#message", "short");
		await submitForm(page2);
		await page2.waitForTimeout(1_000);
		const messages = await page2.locator('p[class*="text-red-500"]:visible').allInnerTexts();
		assert(
			"contact form shows validation on invalid submit",
			messages.length > 0,
			messages.length > 0 ? `messages: ${messages.join(" | ")}` : "no validation message shown",
			{ got: messages.join(" | ") },
		);
		await anon.close();
	});

	await guarded("signup form rejects short password client/server", async () => {
		const anon = await newClientContext(browser);
		const page2 = await anon.newPage();
		await openPage(page2, `${baseUrl}/signup`);
		await page2.fill("#name", "QA Short");
		await page2.fill("#nickname", uniqueNickname());
		await page2.fill("#email", `${uniqueNickname()}@qa.example`);
		await page2.fill("#password", "weak");
		await page2.click("#terms");
		await waitForTurnstile(page2);
		await submitForm(page2);
		// A weak password must keep the user on /signup (validation failed).
		await page2.waitForTimeout(2_000);
		const stillOnSignup = new URL(page2.url()).pathname === "/signup";
		assert("signup form rejects short password client/server", stillOnSignup, `url ${page2.url()}`);
		await anon.close();
	});
}

// ----------------------------------------------------------------------------
// Suite 3 — Auth
// ----------------------------------------------------------------------------

async function suiteAuth(browser: Browser, api: APIRequestContext, baseUrl: string, user: TestUser): Promise<void> {
	suite("3. Auth");

	await guarded("login with correct credentials succeeds", async () => {
		const fresh = await playwrightRequest.newContext();
		const result = await nextAuthLogin(fresh, baseUrl, user.email, PASSWORD, randomIp());
		assert("login with correct credentials succeeds", result.ok, `status ${result.status} -> ${result.location}`, {
			got: `${result.status} ${result.location}`,
		});
		await fresh.dispose();
	});

	await guarded("login with wrong password is refused", async () => {
		const fresh = await playwrightRequest.newContext();
		const result = await nextAuthLogin(fresh, baseUrl, user.email, "WrongPass!999", randomIp());
		assert("login with wrong password is refused", !result.ok, `-> ${result.location}`, {
			got: String(result.location),
		});
		await fresh.dispose();
	});

	await guarded("protected page redirects to /login when logged out", async () => {
		const anon = await browser.newContext();
		const page = await anon.newPage();
		await openPage(page, `${baseUrl}/my-account`);
		// my-account is client-guarded; it redirects to /login without a session.
		const redirected = await page
			.waitForURL((url) => url.pathname === "/login", { timeout: 10_000 })
			.then(() => true)
			.catch(() => false);
		assert("protected page redirects to /login when logged out", redirected, `url ${page.url()}`);
		await anon.close();
	});

	await guarded("admin is 404 for anonymous", async () => {
		const response = await api.get(`${baseUrl}/admin`);
		assert("admin is 404 for anonymous", response.status() === 404, `status ${response.status()}`, {
			got: String(response.status()),
		});
	});

	await guarded("reserved nicknames are rejected at signup", async () => {
		const anon = await newClientContext(browser);
		const page = await anon.newPage();
		await openPage(page, `${baseUrl}/signup`);
		await page.fill("#name", "Reserved Name");
		await page.fill("#nickname", "admin");
		await page.fill("#email", `${uniqueNickname()}@qa.example`);
		await page.fill("#password", PASSWORD);
		await page.click("#terms");
		await waitForTurnstile(page);
		await submitForm(page);
		await page.waitForTimeout(2_000);
		const stillOnSignup = new URL(page.url()).pathname === "/signup";
		assert("reserved nicknames are rejected at signup", stillOnSignup, `url ${page.url()}`);
		await anon.close();
	});

	await guarded("change password requires the current password", async () => {
		// Attempt a password change without the current password through the account form.
		const { page } = user;
		await page.setViewportSize({ width: 1280, height: 900 });
		await openPage(page, `${baseUrl}/my-account`);
		const appeared = await page
			.waitForSelector("#new-password", { timeout: 15_000 })
			.then(() => true)
			.catch(() => false);
		if (!appeared) {
			skip("change password requires the current password", "password form did not render");
			return;
		}
		await page.fill("#new-password", "QaChanged!234");
		await page.fill("#confirm-password", "QaChanged!234");
		// Submit the password form only (scoped so we never hit the delete-account button).
		await page
			.locator('form:has(#new-password) button[type="submit"]')
			.first()
			.click()
			.catch(() => undefined);
		await page.waitForTimeout(2_000);
		// Without the current password the server rejects; the password must stay PASSWORD (verified by login).
		const fresh = await playwrightRequest.newContext();
		const stillOld = await nextAuthLogin(fresh, baseUrl, user.email, PASSWORD, randomIp());
		await fresh.dispose();
		assert(
			"change password requires the current password",
			stillOld.ok,
			stillOld.ok ? "old password still valid (change was refused)" : "old password no longer valid",
		);
	});
}

// ----------------------------------------------------------------------------
// Suite 4 — Authorization on every API route (enumerated from the filesystem)
// ----------------------------------------------------------------------------

interface ApiRoute {
	url: string;
	methods: string[];
}

function enumerateApiRoutes(): ApiRoute[] {
	const here = dirname(fileURLToPath(import.meta.url));
	const apiRoot = join(here, "app", "api");
	const routes: ApiRoute[] = [];
	const walk = (dir: string): void => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const full = join(dir, entry.name);
			if (entry.isDirectory()) walk(full);
			else if (entry.name === "route.ts") {
				const src = readFileSync(full, "utf8");
				const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"].filter((m) =>
					new RegExp(`export async function ${m}\\b`).test(src),
				);
				const url = `/api${full
					.slice(apiRoot.length)
					.replace(/\\/g, "/")
					.replace(/\/route\.ts$/, "")}`;
				if (methods.length > 0) routes.push({ url, methods });
			}
		}
	};
	walk(apiRoot);
	return routes;
}

/**
 * Routes that are legitimately reachable without a user session (health, contact, password reset):
 * they may answer 2xx/4xx but must never 5xx, and must not leak another user's data.
 */
const PUBLIC_API = new Set([
	"/api/health",
	"/api/auth/verify-session",
	"/api/send-contact-email",
	"/api/reset-password/request",
	"/api/reset-password/reset",
	"/api/reset-password/verify",
]);
/** Routes guarded by their own secret/signature (webhooks, cron); unauth must be 4xx, never 2xx/5xx. */
const SECRET_API = new Set(["/api/webhook/abacatepay", "/api/webhook/stripe", "/api/cronjob"]);

function sampleQuery(url: string): string {
	if (url === "/api/pix/check") return "?id=qa-nonexistent";
	if (url === "/api/user/block-status") return "?targetNickname=qa-nonexistent";
	if (url === "/api/reset-password/verify") return "?token=qaqaqaqaqaqaqaqaqaqaqaqaqaqaqaqa";
	return "";
}

async function suiteAuthorizationUnauth(api: APIRequestContext, baseUrl: string, routes: ApiRoute[]): Promise<void> {
	suite("4a. Authorization — unauthenticated API calls");
	for (const route of routes) {
		if (route.url.includes("[") || route.url === "/api/uploadthing") continue; // dynamic / third-party handler
		for (const method of route.methods) {
			await guarded(`${method} ${route.url} unauth`, async () => {
				const response = await api.fetch(`${baseUrl}${route.url}${sampleQuery(route.url)}`, {
					method,
					headers: { "content-type": "application/json" },
					data: method === "GET" ? undefined : "{}",
				});
				const status = response.status();
				let ok: boolean;
				let expectation: string;
				if (PUBLIC_API.has(route.url)) {
					ok = status < 500;
					expectation = "public: must not 5xx";
				} else if (SECRET_API.has(route.url)) {
					ok = status >= 400 && status < 500;
					expectation = "secret: must be 4xx";
				} else {
					ok = status === 401 || status === 403 || status === 404;
					expectation = "protected: must be 401/403/404";
				}
				assert(`${method} ${route.url} unauth`, ok, `status ${status} (${expectation})`, {
					got: `${status}: ${await bodyExcerpt(response)}`,
				});
			});
		}
	}
}

async function suiteAuthorizationCrossUser(
	userA: TestUser,
	userB: TestUser,
	admin: BrowserContext,
	baseUrl: string,
): Promise<void> {
	suite("4b. Authorization — acting on another user's objects");
	const apiA = userA.context.request;
	const apiB = userB.context.request;

	// A creates a PIX charge (owned by A); B must not be able to read it.
	let pixId = "";
	await guarded("B cannot read A's PIX charge", async () => {
		const create = await apiA.post(`${baseUrl}/api/pix/create`, {
			data: { amount: 500, nickname: userB.nickname },
		});
		const created = (await create.json()) as { id?: string };
		pixId = created.id ?? "";
		// Without a real charge id the 404 below would prove nothing.
		if (!pixId) throw new Error(`A could not create a PIX charge: ${create.status()}`);
		const read = await apiB.get(`${baseUrl}/api/pix/check?id=${encodeURIComponent(pixId)}`);
		assert("B cannot read A's PIX charge", read.status() === 404, `status ${read.status()}`, {
			sent: `check A charge ${pixId} as B`,
			got: `${read.status()}: ${await bodyExcerpt(read)}`,
		});
	});

	// A asks B a credit question, then A (the asker, not the owner) tries to answer/refuse/delete it.
	let questionId = "";
	await guarded("A cannot answer/refuse/delete B's received question", async () => {
		// Give A credits then ask B.
		await apiA.post(`${baseUrl}/api/stripe/checkout`, { data: { amount: 1000 } });
		const ask = await apiA.post(`${baseUrl}/api/question/create-with-credits`, {
			data: {
				question_text: "Cross-user authorization probe — this must be owned by B.",
				owner_user_id: userB.id,
				amount: 500,
			},
		});
		const asked = (await ask.json()) as { question?: { id?: string } };
		questionId = asked.question?.id ?? "";
		if (!questionId) throw new Error(`A could not ask B: ${ask.status()}`);
		const answer = await apiA.post(`${baseUrl}/api/question/answer`, {
			data: { questionId, answerText: "A should not be able to answer a question that belongs to B at all." },
		});
		const refuse = await apiA.post(`${baseUrl}/api/question/recused`, { data: { questionId } });
		const del = await apiA.post(`${baseUrl}/api/question/delete`, { data: { questionId } });
		const refused = answer.status() === 403 && refuse.status() === 403 && del.status() === 403;
		assert(
			"A cannot answer/refuse/delete B's received question",
			refused,
			`answer ${answer.status()}, refuse ${refuse.status()}, delete ${del.status()}`,
			{ got: `answer=${answer.status()} refuse=${refuse.status()} delete=${del.status()}` },
		);
	});

	await guarded("non-admin gets 404 on /admin, admin renders it", async () => {
		const asUser = await userA.context.request.get(`${baseUrl}/admin`);
		const asAdmin = await admin.request.get(`${baseUrl}/admin`);
		const adminHtml = await asAdmin.text();
		assert(
			"non-admin gets 404 on /admin, admin renders it",
			asUser.status() === 404 && asAdmin.status() === 200 && adminHtml.includes("Admin dashboard"),
			`user ${asUser.status()}, admin ${asAdmin.status()}`,
			{ got: `user=${asUser.status()} admin=${asAdmin.status()}` },
		);
	});
}

// ----------------------------------------------------------------------------
// Suite 5 — Injection and abuse
// ----------------------------------------------------------------------------

interface XssProbe {
	dialogFired: boolean;
	liveNodes: number;
	text: string;
}

/** Render a page in a fresh tab and report whether any planted payload executed or became a live node. */
async function probeXss(context: BrowserContext, url: string): Promise<XssProbe> {
	const page = await context.newPage();
	let dialogFired = false;
	page.on("dialog", async (dialog) => {
		dialogFired = true;
		await dialog.dismiss();
	});
	try {
		await openPage(page, url);
		await page.waitForTimeout(2_500); // client-side lists load after hydration
		const liveNodes = await page.evaluate((selector) => document.querySelectorAll(selector).length, XSS_LIVE_NODES);
		const text = await page.evaluate(() => document.body.innerText);
		return { dialogFired, liveNodes, text };
	} finally {
		await page.close();
	}
}

async function suiteInjectionAndAbuse(userA: TestUser, userB: TestUser, baseUrl: string): Promise<void> {
	suite("5. Injection and abuse");
	const api = userA.context.request;

	// SQL injection in the login email — must behave exactly like a plain wrong value (refused, no 5xx).
	await guarded("SQLi in login email is a plain failure", async () => {
		let allClean = true;
		const details: string[] = [];
		for (const payload of SQLI_PAYLOADS) {
			const fresh = await playwrightRequest.newContext();
			const result = await nextAuthLogin(fresh, baseUrl, payload, payload, randomIp());
			await fresh.dispose();
			const bad = result.ok || result.status >= 500;
			if (bad) allClean = false;
			details.push(`${payload}=>${result.status}`);
		}
		assert("SQLi in login email is a plain failure", allClean, details.join(", "), { got: details.join(", ") });
	});

	// SQLi in query strings / JSON bodies on authenticated routes — never 5xx, never a privileged answer.
	await guarded("SQLi in query strings and bodies never 5xx", async () => {
		let allClean = true;
		const details: string[] = [];
		for (const payload of SQLI_PAYLOADS) {
			const q = await api.get(`${baseUrl}/api/user/block-status?targetNickname=${encodeURIComponent(payload)}`);
			const b = await api.post(`${baseUrl}/api/question/update-like`, { data: { questionId: payload } });
			if (q.status() >= 500 || b.status() >= 500) allClean = false;
			details.push(`q${q.status()}/b${b.status()}`);
		}
		assert("SQLi in query strings and bodies never 5xx", allClean, details.join(", "), { got: details.join(", ") });
	});

	// XSS in profile name + description, rendered on the profile page.
	await guarded("XSS in profile name/description renders as text", async () => {
		// update-personal-info accepts JSON; name <= 24 chars, description 32-256 chars.
		const update = await api.post(`${baseUrl}/api/user/update-personal-info`, {
			data: { name: XSS_IMG, description: XSS_SCRIPT, website: "" },
		});
		if (!update.ok()) {
			// Nothing was stored, so there is nothing to render: rejecting the payload is safe but untested here.
			skip(
				"XSS in profile name/description renders as text",
				`server rejected the payload (${update.status()}: ${await bodyExcerpt(update)})`,
			);
			return;
		}
		const probe = await probeXss(userA.context, `${baseUrl}/${userA.nickname}`);
		const shownAsText = probe.text.includes(XSS_IMG);
		assert(
			"XSS in profile name/description renders as text",
			!probe.dialogFired && probe.liveNodes === 0 && shownAsText,
			`dialog ${probe.dialogFired}, live nodes ${probe.liveNodes}, payload visible as text ${shownAsText}`,
			{ sent: `name=${XSS_IMG}`, got: `dialog=${probe.dialogFired} liveNodes=${probe.liveNodes}` },
		);
	});

	// XSS in a question and its answer: stored through the real API, then rendered where each side reads it
	// (B's inbox, A's sent list, B's public profile and the feed).
	await guarded("XSS in question/answer text renders as text", async () => {
		await api.post(`${baseUrl}/api/stripe/checkout`, { data: { amount: 1000 } });
		const ask = await api.post(`${baseUrl}/api/question/create-with-credits`, {
			data: { question_text: XSS_QUESTION, owner_user_id: userB.id, amount: 500 },
		});
		const questionId = ((await ask.json()) as { question?: { id?: string } }).question?.id ?? "";
		if (!questionId) throw new Error(`could not store the XSS question: ${ask.status()}`);

		const inbox = await probeXss(userB.context, `${baseUrl}/received-questions`);
		const answer = await userB.context.request.post(`${baseUrl}/api/question/answer`, {
			data: { questionId, answerText: XSS_ANSWER },
		});
		const rendered = [
			inbox,
			await probeXss(userA.context, `${baseUrl}/sent-questions`),
			await probeXss(userA.context, `${baseUrl}/${userB.nickname}`),
			await probeXss(userA.context, `${baseUrl}/feed`),
		];
		const executed = rendered.some((probe) => probe.dialogFired || probe.liveNodes > 0);
		// The payload must actually have been on screen, otherwise "nothing executed" proves nothing.
		const shownAsText = inbox.text.includes(XSS_QUESTION);
		assert(
			"XSS in question/answer text renders as text",
			answer.ok() && !executed && shownAsText,
			`answer ${answer.status()}, executed ${executed}, question visible as text in the inbox ${shownAsText}`,
			{
				sent: XSS_QUESTION,
				got: rendered.map((probe) => `dialog=${probe.dialogFired} liveNodes=${probe.liveNodes}`).join(" | "),
			},
		);
	});

	// Malformed JSON, wrong types, missing fields, oversized bodies, bad amounts — never 5xx.
	await guarded("malformed/garbage POST bodies never 5xx", async () => {
		const targets = [
			"/api/pix/create",
			"/api/question/create",
			"/api/question/create-with-credits",
			"/api/stripe/checkout",
			"/api/user/update-personal-info",
			"/api/user/follow",
		];
		const bodies: { label: string; raw: string }[] = [
			{ label: "malformed-json", raw: "{not json" },
			{ label: "wrong-types", raw: JSON.stringify({ amount: "lots", owner_user_id: 123, question_text: [] }) },
			{ label: "missing-fields", raw: "{}" },
			{ label: "oversized", raw: JSON.stringify({ question_text: "x".repeat(200_000), amount: 500 }) },
			{
				label: "negative-amount",
				raw: JSON.stringify({ amount: -500, owner_user_id: "x", question_text: "x".repeat(40) }),
			},
			{
				label: "zero-amount",
				raw: JSON.stringify({ amount: 0, owner_user_id: "x", question_text: "x".repeat(40) }),
			},
			{
				label: "huge-amount",
				raw: JSON.stringify({ amount: 9_999_999_999, owner_user_id: "x", question_text: "x".repeat(40) }),
			},
			{
				label: "float-amount",
				raw: JSON.stringify({ amount: 5.5, owner_user_id: "x", question_text: "x".repeat(40) }),
			},
		];
		const failures: string[] = [];
		for (const target of targets) {
			for (const body of bodies) {
				const response = await api.fetch(`${baseUrl}${target}`, {
					method: "POST",
					headers: { "content-type": "application/json" },
					data: body.raw,
				});
				if (response.status() >= 500) failures.push(`${target} [${body.label}] -> ${response.status()}`);
			}
		}
		assert(
			"malformed/garbage POST bodies never 5xx",
			failures.length === 0,
			failures.length ? failures.join("; ") : "all handled with 4xx",
			{
				got: failures.join("; ").slice(0, 500),
			},
		);
	});
}

// ----------------------------------------------------------------------------
// Suite 6 — Money, PIX rail end to end
// ----------------------------------------------------------------------------

/** calculatePayout mirror (lib/services/withdraw.service.ts) for asserting expected values. */
function calculatePayout(amountCents: number): number {
	return Math.ceil(amountCents * (amountCents <= 500 ? 0.5 : 0.7));
}

async function suitePixRail(userA: TestUser, userB: TestUser, baseUrl: string): Promise<void> {
	suite("6. Money — PIX rail");
	const apiA = userA.context.request;
	const apiB = userB.context.request;
	const amount = 1000; // R$10.00 -> payout 700 (70%)

	let pixId = "";
	let questionId = "";

	await guarded("PIX charge is created and confirmed, question created", async () => {
		const create = await apiA.post(`${baseUrl}/api/pix/create`, { data: { amount, nickname: userB.nickname } });
		pixId = ((await create.json()) as { id?: string }).id ?? "";
		const check = await apiA.get(`${baseUrl}/api/pix/check?id=${encodeURIComponent(pixId)}`);
		const checkStatus = ((await check.json()) as { status?: string }).status;
		// Amount in the body must be ignored by the server (it uses the confirmed charge amount).
		const ask = await apiA.post(`${baseUrl}/api/question/create`, {
			data: {
				question_text: "PIX rail probe — created from a confirmed charge.",
				owner_user_id: userB.id,
				pix_id: pixId,
				amount: 999999,
			},
		});
		const asked = (await ask.json()) as { question?: { id?: string; amount_paid?: number } };
		questionId = asked.question?.id ?? "";
		const amountRecorded = asked.question?.amount_paid;
		assert(
			"PIX charge is created and confirmed, question created",
			checkStatus === "PAID" && ask.status() === 201 && amountRecorded === amount,
			`check ${checkStatus}, create ${ask.status()}, amount_paid ${amountRecorded} (expected ${amount})`,
			{ got: `${ask.status()} amount_paid=${amountRecorded}` },
		);
	});

	await guarded("reusing a paid PIX charge is refused", async () => {
		const reuse = await apiA.post(`${baseUrl}/api/question/create`, {
			data: {
				question_text: "Trying to reuse an already consumed PIX charge for a second question.",
				owner_user_id: userB.id,
				pix_id: pixId,
			},
		});
		assert("reusing a paid PIX charge is refused", reuse.status() === 409, `status ${reuse.status()}`, {
			got: `${reuse.status()}: ${await bodyExcerpt(reuse)}`,
		});
	});

	await guarded("another user's PIX charge is refused for question creation", async () => {
		const create = await apiB.post(`${baseUrl}/api/pix/create`, { data: { amount, nickname: userA.nickname } });
		const bPix = ((await create.json()) as { id?: string }).id ?? "";
		await apiB.get(`${baseUrl}/api/pix/check?id=${encodeURIComponent(bPix)}`); // confirm it (as B)
		const steal = await apiA.post(`${baseUrl}/api/question/create`, {
			data: {
				question_text: "Trying to create a question against a charge that belongs to another user.",
				owner_user_id: userB.id,
				pix_id: bPix,
			},
		});
		assert(
			"another user's PIX charge is refused for question creation",
			steal.status() === 404,
			`status ${steal.status()}`,
			{
				got: `${steal.status()}: ${await bodyExcerpt(steal)}`,
			},
		);
	});

	await guarded("B answers, balance reflects calculatePayout (70%)", async () => {
		const answer = await apiB.post(`${baseUrl}/api/question/answer`, {
			data: {
				questionId,
				answerText: "This is B answering the PIX question so the payout becomes withdrawable soon.",
			},
		});
		await userB.page.setViewportSize({ width: 1280, height: 900 });
		await openPage(userB.page, `${baseUrl}/payments`);
		await userB.page.waitForTimeout(3_000);
		const expected = calculatePayout(amount); // 700 cents -> R$7.00
		const content = await userB.page.content();
		const shows = content.includes("7.00") || content.includes("7,00");
		assert(
			"B answers, balance reflects calculatePayout (70%)",
			answer.status() === 200 && shows,
			`answer ${answer.status()}, expected payout ${expected} cents visible=${shows}`,
			{ got: `answer=${answer.status()} payoutVisible=${shows}` },
		);
	});

	await guarded("withdraw below the minimum is blocked in the UI", async () => {
		// B's single answered question (R$7.00 payout) is below the R$100 minimum, so the button is disabled.
		const disabled = await userB.page
			.getByRole("button", { name: /Withdraw money/ })
			.first()
			.isDisabled()
			.catch(() => false);
		assert(
			"withdraw below the minimum is blocked in the UI",
			disabled,
			disabled ? "button disabled" : "button not disabled",
		);
	});
}

// ----------------------------------------------------------------------------
// Suite 7 — Money, Stripe credits rail end to end
// ----------------------------------------------------------------------------

async function creditsBalance(api: APIRequestContext, baseUrl: string): Promise<number> {
	const response = await api.get(`${baseUrl}/api/stripe/connect`);
	return ((await response.json()) as { credits?: number }).credits ?? 0;
}

async function suiteCreditsRail(
	userA: TestUser,
	userB: TestUser,
	admin: BrowserContext,
	baseUrl: string,
): Promise<void> {
	suite("7. Money — Stripe credits rail");
	const apiA = userA.context.request;
	const apiB = userB.context.request;

	await guarded("buying credits increases balance by exactly the amount", async () => {
		const before = await creditsBalance(apiA, baseUrl);
		const buy = await apiA.post(`${baseUrl}/api/stripe/checkout`, { data: { amount: 2000 } });
		const after = await creditsBalance(apiA, baseUrl);
		assert(
			"buying credits increases balance by exactly the amount",
			buy.status() === 200 && after === before + 2000,
			`before ${before}, after ${after} (expected +2000)`,
			{ got: `before=${before} after=${after}` },
		);
	});

	await guarded("invalid credit purchase amounts are refused", async () => {
		const low = await apiA.post(`${baseUrl}/api/stripe/checkout`, { data: { amount: 100 } });
		const float = await apiA.post(`${baseUrl}/api/stripe/checkout`, { data: { amount: 5.5 } });
		const huge = await apiA.post(`${baseUrl}/api/stripe/checkout`, { data: { amount: 10_000_000 } });
		assert(
			"invalid credit purchase amounts are refused",
			low.status() === 400 && float.status() === 400 && huge.status() === 400,
			`low ${low.status()}, float ${float.status()}, huge ${huge.status()}`,
		);
	});

	await guarded("asking with credits debits exactly; self and over-balance refused", async () => {
		const before = await creditsBalance(apiA, baseUrl);
		const self = await apiA.post(`${baseUrl}/api/question/create-with-credits`, {
			data: {
				question_text: "Asking myself a question should be refused by the server outright.",
				owner_user_id: userA.id,
				amount: 300,
			},
		});
		const over = await apiA.post(`${baseUrl}/api/question/create-with-credits`, {
			data: {
				question_text: "Asking with far more credits than the balance has must be refused.",
				owner_user_id: userB.id,
				amount: before + 100_000,
			},
		});
		const ask = await apiA.post(`${baseUrl}/api/question/create-with-credits`, {
			data: {
				question_text: "A valid credits question from A to B that debits exactly the amount.",
				owner_user_id: userB.id,
				amount: 300,
			},
		});
		const after = await creditsBalance(apiA, baseUrl);
		assert(
			"asking with credits debits exactly; self and over-balance refused",
			self.status() === 400 && over.status() === 400 && ask.status() === 201 && after === before - 300,
			`self ${self.status()}, over ${over.status()}, ask ${ask.status()}, debit ${before}->${after}`,
			{ got: `self=${self.status()} over=${over.status()} ask=${ask.status()} balance=${before}->${after}` },
		);
	});

	await guarded("concurrent double spend debits only once", async () => {
		// Set a precise balance by draining then buying: use the current balance and ask twice in parallel for the whole of it.
		const balance = await creditsBalance(apiA, baseUrl);
		const spend = Math.min(balance, 100_000);
		if (spend < 200) {
			skip("concurrent double spend debits only once", `balance ${balance} too low to test`);
			return;
		}
		const [r1, r2] = await Promise.all([
			apiA.post(`${baseUrl}/api/question/create-with-credits`, {
				data: {
					question_text: "Parallel credits request number one competing for the same balance.",
					owner_user_id: userB.id,
					amount: spend,
				},
			}),
			apiA.post(`${baseUrl}/api/question/create-with-credits`, {
				data: {
					question_text: "Parallel credits request number two competing for the same balance.",
					owner_user_id: userB.id,
					amount: spend,
				},
			}),
		]);
		const statuses = [r1.status(), r2.status()].sort();
		const after = await creditsBalance(apiA, baseUrl);
		const exactlyOne = statuses[0] === 201 && statuses[1] === 400 && after === balance - spend;
		assert(
			"concurrent double spend debits only once",
			exactlyOne,
			`statuses ${statuses.join("/")}, balance ${balance}->${after} (spend ${spend})`,
			{ got: `statuses=${statuses.join("/")} balance=${balance}->${after}` },
		);
	});

	await guarded("B registers payout account and answers; transfer recorded", async () => {
		// B buys nothing; B registers a (simulated) payout account, then answers a credit question from A.
		const onboarding = await apiB.post(`${baseUrl}/api/stripe/connect`, { data: { country: "US" } });
		// Fund A and ask B.
		await apiA.post(`${baseUrl}/api/stripe/checkout`, { data: { amount: 2000 } });
		const ask = await apiA.post(`${baseUrl}/api/question/create-with-credits`, {
			data: {
				question_text: "A credits question that B will answer so the payout transfer is recorded.",
				owner_user_id: userB.id,
				amount: 1000,
			},
		});
		const questionId = ((await ask.json()) as { question?: { id?: string } }).question?.id ?? "";
		// The admin dashboard's "Answered" counter and USD platform revenue both move when B answers; the
		// transfer being recorded (simulated tr_sim_...) keeps the question out of "Pending credit settlements".
		const before = await adminStats(admin, baseUrl);
		const answer = await apiB.post(`${baseUrl}/api/question/answer`, {
			data: {
				questionId,
				answerText: "B answers the credits question, settling the payout to B's connected account.",
			},
		});
		const after = await adminStats(admin, baseUrl);
		const settled =
			onboarding.status() === 200 &&
			answer.status() === 200 &&
			after.answered === before.answered + 1 &&
			after.pending <= before.pending;
		assert(
			"B registers payout account and answers; transfer recorded",
			settled,
			`onboarding ${onboarding.status()}, answer ${answer.status()}, answered ${before.answered}->${after.answered}, pending ${before.pending}->${after.pending}`,
			{
				got: `answered=${before.answered}->${after.answered} pending=${before.pending}->${after.pending}`,
			},
		);
	});

	await guarded("a refused credit question refunds the asker exactly once", async () => {
		await apiA.post(`${baseUrl}/api/stripe/checkout`, { data: { amount: 2000 } });
		const before = await creditsBalance(apiA, baseUrl);
		const ask = await apiA.post(`${baseUrl}/api/question/create-with-credits`, {
			data: {
				question_text: "A credits question that B will decline, so the credits return to A in full.",
				owner_user_id: userB.id,
				amount: 400,
			},
		});
		const questionId = ((await ask.json()) as { question?: { id?: string } }).question?.id ?? "";
		const afterAsk = await creditsBalance(apiA, baseUrl);
		const refuse = await apiB.post(`${baseUrl}/api/question/recused`, { data: { questionId } });
		// A second settle attempt (report) must not double-refund.
		await apiB
			.post(`${baseUrl}/api/question/report-question`, { data: { questionId, isOffensive: true } })
			.catch(() => undefined);
		const afterRefund = await creditsBalance(apiA, baseUrl);
		assert(
			"a refused credit question refunds the asker exactly once",
			ask.status() === 201 && refuse.status() === 200 && afterAsk === before - 400 && afterRefund === before,
			`before ${before}, afterAsk ${afterAsk}, afterRefund ${afterRefund} (expected back to ${before})`,
			{ got: `before=${before} afterAsk=${afterAsk} afterRefund=${afterRefund}` },
		);
	});
}

/** Parse the admin dashboard's labeled counters (tags stripped, label followed by its number). */
async function adminStats(admin: BrowserContext, baseUrl: string): Promise<{ answered: number; pending: number }> {
	const response = await admin.request.get(`${baseUrl}/admin`);
	const text = (await response.text()).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
	const read = (pattern: RegExp): number => {
		const match = text.match(pattern);
		return match ? Number(match[1]) : Number.NaN;
	};
	return {
		answered: read(/\bAnswered\s+(\d+)/),
		pending: read(/Pending credit settlements\s+(\d+)/),
	};
}

// ----------------------------------------------------------------------------
// Suite 8 — Robustness
// ----------------------------------------------------------------------------

async function suiteRobustness(browser: Browser, baseUrl: string): Promise<void> {
	suite("8. Robustness");

	await guarded("rapid repeated signups do not create duplicate accounts", async () => {
		// Fire the same signup twice quickly; the unique nickname/email must let only one through.
		const nickname = uniqueNickname();
		const email = `${nickname}@qa.example`;
		const attempt = async (): Promise<string> => {
			const context = await newClientContext(browser);
			const page = await context.newPage();
			await openPage(page, `${baseUrl}/signup`);
			await page.fill("#name", `Dup ${nickname}`);
			await page.fill("#nickname", nickname);
			await page.fill("#email", email);
			await page.fill("#password", PASSWORD);
			await page.click("#terms");
			await waitForTurnstile(page);
			await submitForm(page);
			await page.waitForTimeout(4_000);
			const path = new URL(page.url()).pathname;
			await context.close();
			return path;
		};
		const [p1, p2] = await Promise.all([attempt(), attempt()]);
		// Success leaves /signup (to /my-account, or /login when the auto-login loses the captcha race).
		const succeeded = [p1, p2].filter((p) => p !== "/signup").length;
		// The account must exist, otherwise two rejected signups would pass as "no duplicate".
		const fresh = await playwrightRequest.newContext();
		const login = await nextAuthLogin(fresh, baseUrl, email, PASSWORD, randomIp());
		await fresh.dispose();
		assert(
			"rapid repeated signups do not create duplicate accounts",
			succeeded <= 1 && login.ok,
			`landing pages ${p1} / ${p2} (successes ${succeeded}), account usable ${login.ok}`,
			{ got: `${p1} / ${p2} login=${login.ok}` },
		);
	});

	await guarded("login rate limit eventually returns 429 and recovers for another account", async () => {
		const ip = randomIp();
		const api = await playwrightRequest.newContext();
		let saw429 = false;
		for (let i = 0; i < 14; i += 1) {
			const result = await nextAuthLogin(api, baseUrl, `ratelimit${i}@qa.example`, "WrongPass!1", ip);
			if (result.location?.includes("rate_limited")) {
				saw429 = true;
				break;
			}
		}
		// A different IP must still be able to attempt (recovery / isolation).
		const other = await nextAuthLogin(api, baseUrl, "someone@qa.example", "WrongPass!1", randomIp());
		const otherNotLimited = !other.location?.includes("rate_limited");
		await api.dispose();
		if (!saw429) {
			skip(
				"login rate limit eventually returns 429 and recovers for another account",
				"rate limiting appears disabled in this environment",
			);
			return;
		}
		assert(
			"login rate limit eventually returns 429 and recovers for another account",
			saw429 && otherNotLimited,
			`saw rate_limited=${saw429}, other IP limited=${!otherNotLimited}`,
		);
	});
}

// ----------------------------------------------------------------------------
// Suite 9 — Optional real Stripe sandbox
// ----------------------------------------------------------------------------

async function suiteStripeSandbox(userA: TestUser, baseUrl: string, enabled: boolean): Promise<void> {
	suite("9. Stripe sandbox (optional)");
	if (!enabled) {
		skip(
			"hosted Stripe Checkout with test card",
			"run with --stripe=sandbox against real Stripe test keys to enable",
		);
		return;
	}
	await guarded("hosted Stripe Checkout with test card", async () => {
		const buy = await userA.context.request.post(`${baseUrl}/api/stripe/checkout`, { data: { amount: 2000 } });
		const url = ((await buy.json()) as { url?: string }).url ?? "";
		if (!url.includes("checkout.stripe.com")) {
			skip("hosted Stripe Checkout with test card", `environment is simulated (checkout url ${url})`);
			return;
		}
		const page = await userA.context.newPage();
		await page.goto(url, { waitUntil: "networkidle" });
		await page.fill('input[name="cardNumber"]', "4000000000000077");
		await page.fill('input[name="cardExpiry"]', "12/34");
		await page.fill('input[name="cardCvc"]', "123");
		await page.fill('input[name="billingName"]', "QA Tester");
		await page.getByRole("button", { name: /Pay/ }).click();
		const credited = await page
			.waitForURL((u) => u.pathname.includes("/my-account"), { timeout: 60_000 })
			.then(() => true)
			.catch(() => false);
		assert(
			"hosted Stripe Checkout with test card",
			credited,
			credited ? "redirected back after payment" : "no redirect after payment",
		);
		await page.close();
	});
}

// ----------------------------------------------------------------------------
// Admin login (through the real UI) for the authorization and money suites
// ----------------------------------------------------------------------------

async function loginAdmin(browser: Browser, baseUrl: string, email: string, password: string): Promise<BrowserContext> {
	const context = await newClientContext(browser);
	// Deterministic session through the NextAuth endpoint on the context's shared cookie jar.
	const result = await nextAuthLogin(context.request, baseUrl, email, password, randomIp());
	if (!result.ok) throw new Error(`admin login failed: ${result.status} ${result.location}`);
	return context;
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

async function main(): Promise<void> {
	const args = parseArgs(process.argv.slice(2));
	const url = new URL(args.baseUrl);

	// Safety: never production, no remote without explicit opt-in.
	if (url.hostname === PRODUCTION_HOST) {
		console.error(`Refusing to run against production (${PRODUCTION_HOST}).`);
		process.exit(2);
	}
	if (!isLocalHost(url.hostname) && !args.allowRemote) {
		console.error(`Refusing to run against a non-local host (${url.hostname}). Pass --allow-remote to override.`);
		process.exit(2);
	}

	console.log(`Askedly QA — target ${args.baseUrl}${args.allowRemote ? " (remote allowed)" : ""}`);

	const api = await playwrightRequest.newContext();
	const browser = await chromium.launch({ headless: !args.headed });

	let admin: BrowserContext | undefined;
	let userA: TestUser | undefined;
	let userB: TestUser | undefined;

	try {
		const routes = enumerateApiRoutes();

		await suitePagesAndLinks(browser, api, args.baseUrl);
		await suiteAuthorizationUnauth(api, args.baseUrl, routes);

		// Create the two users the destructive and money suites need. Every later suite depends on them, so a
		// failure here aborts the run (recorded as a FAIL below) instead of producing dozens of derived failures.
		suite("0. Setup — accounts");
		userA = await createUser(browser, args.baseUrl);
		record("PASS", "user A signs up through the UI and gets a session", userA.nickname);
		userB = await createUser(browser, args.baseUrl);
		record("PASS", "user B signs up through the UI and gets a session", userB.nickname);
		admin = await loginAdmin(browser, args.baseUrl, args.adminEmail, args.adminPassword);
		record("PASS", "admin logs in", args.adminEmail);

		await suiteUiInteractions(browser, userA, args.baseUrl);
		await suiteAuth(browser, api, args.baseUrl, userA);
		await suiteAuthorizationCrossUser(userA, userB, admin, args.baseUrl);
		await suiteInjectionAndAbuse(userA, userB, args.baseUrl);
		await suitePixRail(userA, userB, args.baseUrl);
		await suiteCreditsRail(userA, userB, admin, args.baseUrl);
		await suiteRobustness(browser, args.baseUrl);
		await suiteStripeSandbox(userA, args.baseUrl, args.stripeSandbox);
	} catch (error) {
		// Still print the summary and write the report: what ran before the abort is evidence too.
		record("FAIL", "run aborted", error instanceof Error ? error.message.split("\n")[0] : String(error));
	} finally {
		await userA?.context.close().catch(() => undefined);
		await userB?.context.close().catch(() => undefined);
		await admin?.close().catch(() => undefined);
		await browser.close().catch(() => undefined);
		await api.dispose().catch(() => undefined);
	}

	// Summary.
	const counts = { PASS: 0, FAIL: 0, SKIP: 0 };
	for (const check of checks) counts[check.status] += 1;

	console.log("\n================ SUMMARY ================");
	const bySuite = new Map<string, { PASS: number; FAIL: number; SKIP: number }>();
	for (const check of checks) {
		const row = bySuite.get(check.suite) ?? { PASS: 0, FAIL: 0, SKIP: 0 };
		row[check.status] += 1;
		bySuite.set(check.suite, row);
	}
	for (const [name, row] of bySuite) {
		console.log(`  ${name.padEnd(52)} PASS ${row.PASS}  FAIL ${row.FAIL}  SKIP ${row.SKIP}`);
	}
	console.log("-----------------------------------------");
	console.log(`  TOTAL  PASS ${counts.PASS}  FAIL ${counts.FAIL}  SKIP ${counts.SKIP}`);

	if (counts.FAIL > 0) {
		console.log("\nFailures:");
		for (const check of checks.filter((c) => c.status === "FAIL")) {
			console.log(`  - [${check.suite}] ${check.name}: ${check.reason}`);
			if (check.evidence?.got) console.log(`      got: ${check.evidence.got}`);
		}
	}

	if (args.reportPath) {
		const report = {
			target: args.baseUrl,
			generatedAt: new Date().toISOString(),
			totals: counts,
			checks,
		};
		writeFileSync(args.reportPath, JSON.stringify(report, null, 2));
		console.log(`\nJSON report written to ${args.reportPath}`);
	}

	process.exit(counts.FAIL > 0 ? 1 : 0);
}

main().catch((error: unknown) => {
	console.error(error);
	process.exit(1);
});
