import { expect, test } from "bun:test";
import { localeFromAcceptLanguage } from "./config";

test("localeFromAcceptLanguage picks the best supported language, defaulting to English", () => {
	expect(localeFromAcceptLanguage("pt-BR,pt;q=0.9,en;q=0.8")).toBe("pt");
	expect(localeFromAcceptLanguage("fr-FR,es;q=0.7,en;q=0.9")).toBe("en");
	expect(localeFromAcceptLanguage("fr,es-419;q=0.5")).toBe("es");
	expect(localeFromAcceptLanguage("de")).toBe("en");
	expect(localeFromAcceptLanguage(null)).toBe("en");
});
