"use server";

import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
	getUserQuestionsAnsweredPaymentDetails,
	getUserQuestionsSentPaymentDetails,
} from "@/lib/repositories/questions.repository";
import TelegramLog from "@/lib/telegram-logger";

export async function getAnsweredPaymentDetails(nickname: string) {
	try {
		const data = await getUserQuestionsAnsweredPaymentDetails(nickname);
		return { success: true, data };
	} catch (error: any) {
		await TelegramLog.error(`Erro payment-actions.ts getAnsweredPaymentDetails: ${error?.message}`);
		throw new Error(error?.messsage);
	}
}

export async function getSentPaymentDetails(nickname: string) {
	try {
		const data = await getUserQuestionsSentPaymentDetails(nickname);
		return { success: true, data };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error payment-actions.ts getSentPaymentDetails: ${error?.message}`);
		throw new Error(error?.messsage);
	}
}

export async function processWithdraw(params: {
	userId: string;
	nickname: string;
	amount: number;
	sentToPixKey: string;
	questions: any[];
}) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			TelegramLog.error(`Error payment-actions.ts usuário não autenticado`);
			throw new Error("Usuário não autenticado");
		}

		const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/withdraw`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(params),
		});

		if (!response.ok) {
			const errorData = await response.json();
			TelegramLog.error(`Error payment-actions.ts processWithdraw: ${errorData.error}`);
			throw new Error(errorData.error || "Erro ao processar saque");
		}

		const result = await response.json();

		if (!result.success) {
			TelegramLog.error(`Error payment-actions.ts processWithdraw: ${result.error}`);
			throw new Error(result.error || "Erro desconhecido");
		}

		revalidateTag("user-session");
		revalidateTag(`payment-data-${params.nickname}`);

		return { success: true, data: result };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error payment-actions.ts processWithdraw: ${error?.message}`);
		throw new Error(error?.message);
	}
}
