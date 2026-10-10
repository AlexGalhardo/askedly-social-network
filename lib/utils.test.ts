import { describe, expect, test } from "bun:test";
import { cn, formatCurrency, formatDate, openGraphLocale } from "./utils";

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

describe("formatDate", () => {
	const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

	test("defaults to English", () => {
		expect(formatDate(threeDaysAgo)).toBe("3 days ago");
	});

	test("formats in the given locale", () => {
		expect(formatDate(threeDaysAgo, "pt")).toBe("há 3 dias");
		expect(formatDate(threeDaysAgo, "es")).toBe("hace 3 días");
	});

	test("returns a localized fallback for an invalid date", () => {
		expect(formatDate("not-a-date")).toBe("Invalid date");
		expect(formatDate("not-a-date", "pt")).toBe("Data inválida");
	});
});

describe("openGraphLocale", () => {
	test("maps app locales to Open Graph locales", () => {
		expect(openGraphLocale("en")).toBe("en_US");
		expect(openGraphLocale("pt")).toBe("pt_BR");
		expect(openGraphLocale("es")).toBe("es_ES");
	});
});
