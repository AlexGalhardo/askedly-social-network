export const locales = ["en", "pt", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
	return locales.includes(value as Locale);
}

/** First supported language from the Accept-Language header ("pt-BR,pt;q=0.9,en;q=0.8" becomes "pt"). */
export function localeFromAcceptLanguage(header: string | null): Locale {
	const preferred = (header ?? "")
		.split(",")
		.map((part) => {
			const [tag, q] = part.trim().split(";q=");
			return { language: tag.split("-")[0].toLowerCase(), quality: q ? Number(q) : 1 };
		})
		.sort((a, b) => b.quality - a.quality)
		.find((entry) => isLocale(entry.language));
	return (preferred?.language as Locale | undefined) ?? defaultLocale;
}
