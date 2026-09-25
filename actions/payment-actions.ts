"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
	getUserQuestionsAnsweredPaymentDetails,
	getUserQuestionsSentPaymentDetails,
} from "@/lib/repositories/questions.repository";
import { WithdrawError, withdrawBalance } from "@/lib/services/withdraw.service";
import TelegramLog from "@/lib/telegram-logger";

// Server Actions são endpoints públicos: a identidade vem sempre da sessão, nunca dos argumentos.
async function requireSessionUser(): Promise<{ id: string; nickname: string }> {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id || !session.user.nickname) throw new Error("Usuário não autenticado");
	return { id: session.user.id, nickname: session.user.nickname };
}

export async function getAnsweredPaymentDetails() {
	const { nickname } = await requireSessionUser();
	return { success: true, data: await getUserQuestionsAnsweredPaymentDetails(nickname) };
}

export async function getSentPaymentDetails() {
	const { nickname } = await requireSessionUser();
	return { success: true, data: await getUserQuestionsSentPaymentDetails(nickname) };
}

export async function processWithdraw({ questionIds }: { questionIds: string[] }) {
	const { id } = await requireSessionUser();

	try {
		return await withdrawBalance(id, questionIds);
	} catch (error: unknown) {
		if (error instanceof WithdrawError) throw error;
		await TelegramLog.error(`Catch Error payment-actions.ts processWithdraw: ${(error as Error)?.message}`);
		throw new Error("Erro ao processar saque. Tente novamente.");
	}
}
