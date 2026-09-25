import { describe, expect, test } from "bun:test";
import { calculatePayout } from "@/lib/services/withdraw.service";

describe("calculatePayout", () => {
	test("pays 50% (rounded up) for questions up to R$ 5,00", () => {
		expect(calculatePayout(500)).toBe(250);
		expect(calculatePayout(301)).toBe(151);
	});

	test("pays 70% (rounded up) above R$ 5,00", () => {
		expect(calculatePayout(501)).toBe(351);
		expect(calculatePayout(1000)).toBe(700);
	});

	test("pays nothing for a zero amount", () => {
		expect(calculatePayout(0)).toBe(0);
	});
});
