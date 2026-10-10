export interface PaymentData {
	paymentToWithdraw: number;
	paymentAwaitingAnswer: number;
	paymentSentAnsweredQuestions?: number;
	paymentWithdrawHistory: WithdrawHistory[];
	questionsToPayAmount: any[];
}

export interface WithdrawHistory {
	id: string;
	amount_withdraw: number;
	created_at: Date | string;
	send_to_pix_key: string;
}

export interface WithdrawParams {
	userId: string;
	nickname: string;
	amount: number;
	sentToPixKey: string;
	questions: any[];
}

export type PaymentTab = "answered" | "sent";
