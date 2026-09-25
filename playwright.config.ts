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
		command: `bun node_modules/next/dist/bin/next dev -p ${PORT}`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
});
