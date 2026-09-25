import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PLAYWRIGHT_PORT ?? "3200";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	// No CI o relatório HTML é publicado como artifact quando a suíte falha (ver .github/workflows/e2e.yml).
	reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
	use: {
		baseURL,
		trace: "on-first-retry",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		// Node, não Bun: o Turbopack externaliza @prisma/client e pg por aliases que o resolver do Bun não acha
		// (e a Vercel roda em Node). No CI, servidor de produção (o job roda `bun run build` antes).
		command: `node node_modules/next/dist/bin/next ${process.env.CI ? "start" : "dev"} -p ${PORT}`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
});
