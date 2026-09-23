import { describe, expect, test } from "bun:test";
import { cn, formatCurrency } from "./utils";

describe("cn", () => {
	test("merges class names and resolves tailwind conflicts", () => {
		expect(cn("px-2", "px-4")).toBe("px-4");
	});

	test("drops falsy values", () => {
		expect(cn("a", false, null, undefined, "b")).toBe("a b");
	});
});

describe("formatCurrency", () => {
	// Intl.NumberFormat inserts a non-breaking space ( ) between "R$" and the amount.
	test("formats cents as BRL currency", () => {
		expect(formatCurrency(12345)).toBe("R$ 123,45");
	});

	test("formats zero", () => {
		expect(formatCurrency(0)).toBe("R$ 0,00");
	});
});
