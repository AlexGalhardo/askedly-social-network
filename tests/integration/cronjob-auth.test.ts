import { afterAll, describe, expect, test } from "bun:test";
import { GET } from "@/app/api/cronjob/route";

const previous = process.env.CRON_SECRET;

describe("GET /api/cronjob authorization", () => {
	afterAll(() => {
		process.env.CRON_SECRET = previous;
	});

	test("rejects calls without the cron secret", async () => {
		process.env.CRON_SECRET = "test-cron-secret";
		expect((await GET(new Request("http://localhost/api/cronjob"))).status).toBe(401);
	});

	test("rejects every call when CRON_SECRET is not configured", async () => {
		delete process.env.CRON_SECRET;
		const request = new Request("http://localhost/api/cronjob", { headers: { authorization: "Bearer undefined" } });
		expect((await GET(request)).status).toBe(401);
	});
});
