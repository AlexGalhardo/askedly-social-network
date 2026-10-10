import { describe, expect, test } from "bun:test";
import { DateTime } from "./date-time";

describe("DateTime parsing", () => {
	test("parses Brazilian date format dd/mm/yyyy", () => {
		const dt = new DateTime("25/12/2024");
		expect(dt.day).toBe(25);
		expect(dt.month).toBe(12);
		expect(dt.year).toBe(2024);
	});

	test("parses Brazilian date format with time", () => {
		const dt = new DateTime("25/12/2024 14:30:00");
		expect(dt.hours).toBe(14);
		expect(dt.minutes).toBe(30);
	});

	test("throws on an invalid date string", () => {
		expect(() => new DateTime("not-a-date")).toThrow();
	});

	test("defaults to now when given null", () => {
		const before = Date.now();
		const dt = new DateTime();
		const after = Date.now();
		expect(dt.timestamp()).toBeGreaterThanOrEqual(before);
		expect(dt.timestamp()).toBeLessThanOrEqual(after);
	});
});

describe("DateTime formatting", () => {
	test("formatDate returns dd/mm/yyyy", () => {
		expect(new DateTime("05/01/2024").formatDate()).toBe("05/01/2024");
	});

	test("formatForInput returns yyyy-mm-dd", () => {
		expect(new DateTime("05/01/2024").formatForInput()).toBe("2024-01-05");
	});
});

describe("DateTime arithmetic", () => {
	test("addDays moves the date forward", () => {
		const result = new DateTime("01/01/2024").addDays(10);
		expect(result.formatDate()).toBe("11/01/2024");
	});

	test("diffInDays is the absolute day gap between two dates", () => {
		const a = new DateTime("01/01/2024");
		const b = new DateTime("11/01/2024");
		expect(a.diffInDays(b)).toBe(10);
	});
});

describe("DateTime comparisons", () => {
	test("isBefore/isAfter compare timestamps", () => {
		const earlier = new DateTime("01/01/2024");
		const later = new DateTime("02/01/2024");
		expect(earlier.isBefore(later)).toBe(true);
		expect(later.isAfter(earlier)).toBe(true);
	});

	test("isLeapYear detects leap years", () => {
		expect(new DateTime("01/01/2024").isLeapYear()).toBe(true);
		expect(new DateTime("01/01/2023").isLeapYear()).toBe(false);
	});
});

describe("DateTime.formatRelative", () => {
	test("returns the 'now' phrase for the current instant", () => {
		expect(new DateTime().formatRelative()).toBe("now");
		expect(new DateTime().formatRelative("pt")).toBe("agora");
	});

	test("returns a days-ago phrase for a date a few days in the past", () => {
		const threeDaysAgo = new DateTime().addDays(-3);
		expect(threeDaysAgo.formatRelative()).toBe("3 days ago");
		expect(threeDaysAgo.formatRelative("pt")).toBe("há 3 dias");
	});

	test("keeps the number for a single unit instead of 'yesterday'", () => {
		const oneDayAgo = new DateTime().addDays(-1);
		expect(oneDayAgo.formatRelative("en")).toBe("1 day ago");
		expect(oneDayAgo.formatRelative("pt")).toBe("há 1 dia");
	});
});

describe("DateTime locale-aware names", () => {
	const christmas = new DateTime("25/12/2024 14:30:05");

	test("formatLongDate writes the full date in the given locale", () => {
		expect(christmas.formatLongDate()).toBe("Wednesday, December 25, 2024");
		expect(christmas.formatLongDate("pt")).toBe("quarta-feira, 25 de dezembro de 2024");
	});

	test("monthName and weekdayName follow the locale", () => {
		expect(christmas.monthName()).toBe("December");
		expect(christmas.monthName("pt")).toBe("dezembro");
		expect(christmas.weekdayName()).toBe("Wednesday");
		expect(christmas.weekdayName("pt")).toBe("quarta-feira");
	});

	test("timeInWords spells out the time in the given locale", () => {
		expect(christmas.timeInWords()).toBe("14 hours, 30 minutes, and 5 seconds");
		expect(christmas.timeInWords("pt")).toBe("14 horas, 30 minutos e 5 segundos");
	});
});
