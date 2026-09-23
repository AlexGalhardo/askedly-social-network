import { describe, expect, test } from "bun:test";
import { DateTime } from "./date-time";

describe("DateTime parsing", () => {
	test("parses Brazilian date format dd/mm/yyyy", () => {
		const dt = new DateTime("25/12/2024");
		expect(dt.dia).toBe(25);
		expect(dt.mes).toBe(12);
		expect(dt.ano).toBe(2024);
	});

	test("parses Brazilian date format with time", () => {
		const dt = new DateTime("25/12/2024 14:30:00");
		expect(dt.horas).toBe(14);
		expect(dt.minutos).toBe(30);
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
	test("formatarData returns dd/mm/yyyy", () => {
		expect(new DateTime("05/01/2024").formatarData()).toBe("05/01/2024");
	});

	test("formatarParaInput returns yyyy-mm-dd", () => {
		expect(new DateTime("05/01/2024").formatarParaInput()).toBe("2024-01-05");
	});
});

describe("DateTime arithmetic", () => {
	test("adicionarDias moves the date forward", () => {
		const result = new DateTime("01/01/2024").adicionarDias(10);
		expect(result.formatarData()).toBe("11/01/2024");
	});

	test("diferencaEmDias is the absolute day gap between two dates", () => {
		const a = new DateTime("01/01/2024");
		const b = new DateTime("11/01/2024");
		expect(a.diferencaEmDias(b)).toBe(10);
	});
});

describe("DateTime comparisons", () => {
	test("ehAnterior/ehPosterior compare timestamps", () => {
		const earlier = new DateTime("01/01/2024");
		const later = new DateTime("02/01/2024");
		expect(earlier.ehAnterior(later)).toBe(true);
		expect(later.ehPosterior(earlier)).toBe(true);
	});

	test("ehAnoBissexto detects leap years", () => {
		expect(new DateTime("01/01/2024").ehAnoBissexto()).toBe(true);
		expect(new DateTime("01/01/2023").ehAnoBissexto()).toBe(false);
	});
});

describe("DateTime.formatarRelativo", () => {
	test("returns 'agora mesmo' for the current instant", () => {
		expect(new DateTime().formatarRelativo()).toBe("agora mesmo");
	});

	test("returns a days-ago phrase for a date a few days in the past", () => {
		const threeDaysAgo = new DateTime().adicionarDias(-3);
		expect(threeDaysAgo.formatarRelativo()).toBe("há 3 dias");
	});
});
