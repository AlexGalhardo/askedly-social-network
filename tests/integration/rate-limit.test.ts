import { afterAll, describe, expect, test } from "bun:test";
import {
	clearRateLimit,
	consumeRateLimit,
	deleteExpiredRateLimits,
	isRateLimited,
} from "@/lib/services/rate-limit.service";
import { prisma } from "@/prisma/prisma-client";

// Integração contra Postgres real e descartável (DATABASE_URL); nunca rode num banco com dados reais.
const prefix = `test:${Date.now()}`;

describe("consumeRateLimit (integration)", () => {
	afterAll(async () => {
		await prisma.rateLimit.deleteMany({ where: { key: { startsWith: prefix } } });
	});

	test("allows up to the limit inside the window, then blocks", async () => {
		const rule = { limit: 3, windowMs: 60_000 };
		const results = [];
		for (let i = 0; i < 4; i++) results.push((await consumeRateLimit(`${prefix}:seq`, rule)).allowed);
		expect(results).toEqual([true, true, true, false]);
	});

	test("starts a fresh window after the previous one ends", async () => {
		const rule = { limit: 1, windowMs: 300 };
		expect((await consumeRateLimit(`${prefix}:window`, rule)).allowed).toBe(true);
		expect((await consumeRateLimit(`${prefix}:window`, rule)).allowed).toBe(false);
		await Bun.sleep(400);
		expect((await consumeRateLimit(`${prefix}:window`, rule)).allowed).toBe(true);
	});

	test("counts concurrent requests atomically", async () => {
		const rule = { limit: 5, windowMs: 60_000 };
		const results = await Promise.all(Array.from({ length: 20 }, () => consumeRateLimit(`${prefix}:burst`, rule)));
		expect(results.filter((r) => r.allowed)).toHaveLength(5);
	});

	test("keys are independent", async () => {
		const rule = { limit: 1, windowMs: 60_000 };
		expect((await consumeRateLimit(`${prefix}:a`, rule)).allowed).toBe(true);
		expect((await consumeRateLimit(`${prefix}:b`, rule)).allowed).toBe(true);
	});

	test("the daily cleanup removes only expired windows", async () => {
		await consumeRateLimit(`${prefix}:expired`, { limit: 1, windowMs: 1 });
		await consumeRateLimit(`${prefix}:live`, { limit: 1, windowMs: 60_000 });
		await Bun.sleep(20);
		await deleteExpiredRateLimits();
		const keys = (await prisma.rateLimit.findMany({ where: { key: { startsWith: prefix } } })).map((r) => r.key);
		expect(keys).not.toContain(`${prefix}:expired`);
		expect(keys).toContain(`${prefix}:live`);
	});

	test("isRateLimited only reads: checking does not spend the quota", async () => {
		const rule = { limit: 2, windowMs: 60_000 };
		const key = `${prefix}:peek`;
		for (let i = 0; i < 5; i++) expect(await isRateLimited(key, rule)).toBe(false);
		await consumeRateLimit(key, rule);
		await consumeRateLimit(key, rule);
		expect(await isRateLimited(key, rule)).toBe(true);
	});

	test("clearRateLimit resets a key (e.g. after a successful login)", async () => {
		const rule = { limit: 1, windowMs: 60_000 };
		const key = `${prefix}:clear`;
		await consumeRateLimit(key, rule);
		expect(await isRateLimited(key, rule)).toBe(true);
		await clearRateLimit(key);
		expect(await isRateLimited(key, rule)).toBe(false);
	});
});
