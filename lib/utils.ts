import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { DateTime } from "./date-time";
import TelegramLog from "./telegram-logger";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value / 100);
}

export function formatDate(dateString: string): string {
	try {
		const date = new DateTime(dateString);
		return date.formatarRelativo();
	} catch (error: any) {
		TelegramLog.error(`Catch Error utils.ts formatDate: ${error?.message}`);
		return "Data inválida";
	}
}
