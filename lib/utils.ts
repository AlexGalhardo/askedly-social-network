import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DateTime } from "./date-time";
import TelegramLog from "./telegram-logger";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency: string = "BRL"): string {
	return new Intl.NumberFormat(currency === "USD" ? "en-US" : "pt-BR", { style: "currency", currency }).format(
		value / 100,
	);
}

const INVALID_DATE: Record<string, string> = { en: "Invalid date", pt: "Data inválida", es: "Fecha inválida" };

export function formatDate(dateString: string, locale: string = "en"): string {
	try {
		const date = new DateTime(dateString);
		return date.formatarRelativo(locale);
	} catch (error: any) {
		TelegramLog.error(`Catch Error utils.ts formatDate: ${error?.message}`);
		return INVALID_DATE[locale] ?? INVALID_DATE.en;
	}
}

const OPEN_GRAPH_LOCALES: Record<string, string> = { en: "en_US", pt: "pt_BR", es: "es_ES" };

export function openGraphLocale(locale: string): string {
	return OPEN_GRAPH_LOCALES[locale] ?? OPEN_GRAPH_LOCALES.en;
}
