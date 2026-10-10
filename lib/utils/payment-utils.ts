import { PaymentData } from "@/lib/interfaces";

export const MIN_WITHDRAW_CENTS = 10000; // R$ 100.00

export function canWithdraw(amount: number): boolean {
	return amount >= MIN_WITHDRAW_CENTS;
}

export function validatePixKey(pixKey: string | null | undefined): boolean {
	return Boolean(pixKey && pixKey.trim().length > 0);
}

export function calculateTotalEarnings(paymentData: PaymentData | null): number {
	if (!paymentData) return 0;
	return paymentData.paymentToWithdraw + (paymentData.paymentSentAnsweredQuestions || 0);
}
