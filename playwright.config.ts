import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PLAYWRIGHT_PORT ?? "3200";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	// In CI the HTML report is published as an artifact when the suite fails (see .github/workflows/e2e.yml).
	reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
	use: {
		baseURL,
		trace: "on-first-retry",
		// The specs check Portuguese texts; the site defaults to English and follows the browser language.
		locale: "pt-BR",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		// Node, not Bun: Turbopack externalizes @prisma/client and pg through aliases that Bun's resolver cannot find
		// (and Vercel runs on Node). In CI, production server (the job runs `bun run build` first).
		command: `node node_modules/next/dist/bin/next ${process.env.CI ? "start" : "dev"} -p ${PORT}`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
});
