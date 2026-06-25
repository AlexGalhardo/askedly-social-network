import { PaymentData } from "@/types/PaymentInterface";

export function formatCurrency(value: number): string {
	return (value / 100).toFixed(2);
}

export function formatDate(date: Date | string): string {
	return new Date(date).toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function canWithdraw(amount: number): boolean {
	return amount >= 10000; // R$ 100.00
}

export function getMinimumWithdrawMessage(): string {
	return "Você precisa acumular pelo menos R$ 100 para poder sacar o dinheiro";
}

export function validatePixKey(pixKey: string | null | undefined): boolean {
	return Boolean(pixKey && pixKey.trim().length > 0);
}

export function calculateTotalEarnings(paymentData: PaymentData | null): number {
	if (!paymentData) return 0;
	return paymentData.paymentToWithdraw + (paymentData.paymentSentAnsweredQuestions || 0);
}
