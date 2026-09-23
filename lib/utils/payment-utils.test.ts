import { describe, expect, test } from "bun:test";
import {
	calculateTotalEarnings,
	canWithdraw,
	formatCurrency,
	getMinimumWithdrawMessage,
	validatePixKey,
} from "./payment-utils";

describe("formatCurrency", () => {
	test("converts cents to a decimal string", () => {
		expect(formatCurrency(12345)).toBe("123.45");
	});

	test("handles zero", () => {
		expect(formatCurrency(0)).toBe("0.00");
	});
});

describe("canWithdraw", () => {
	test("is false below the R$100 minimum", () => {
		expect(canWithdraw(9999)).toBe(false);
	});

	test("is true at exactly the R$100 minimum", () => {
		expect(canWithdraw(10000)).toBe(true);
	});

	test("is true above the minimum", () => {
		expect(canWithdraw(50000)).toBe(true);
	});
});

describe("getMinimumWithdrawMessage", () => {
	test("mentions the R$100 minimum", () => {
		expect(getMinimumWithdrawMessage()).toContain("R$ 100");
	});
});

describe("validatePixKey", () => {
	test("rejects null/undefined/empty/whitespace-only keys", () => {
		expect(validatePixKey(null)).toBe(false);
		expect(validatePixKey(undefined)).toBe(false);
		expect(validatePixKey("")).toBe(false);
		expect(validatePixKey("   ")).toBe(false);
	});

	test("accepts a non-empty key", () => {
		expect(validatePixKey("user@example.com")).toBe(true);
	});
});

describe("calculateTotalEarnings", () => {
	test("returns 0 for null payment data", () => {
		expect(calculateTotalEarnings(null)).toBe(0);
	});

	test("sums withdrawable and answered-question earnings", () => {
		expect(
			calculateTotalEarnings({
				paymentToWithdraw: 1000,
				paymentAwaitingAnswer: 0,
				paymentSentAnsweredQuestions: 500,
				paymentWithdrawHistory: [],
				questionsToPayAmount: [],
			}),
		).toBe(1500);
	});

	test("treats a missing paymentSentAnsweredQuestions as 0", () => {
		expect(
			calculateTotalEarnings({
				paymentToWithdraw: 1000,
				paymentAwaitingAnswer: 0,
				paymentWithdrawHistory: [],
				questionsToPayAmount: [],
			}),
		).toBe(1000);
	});
});
