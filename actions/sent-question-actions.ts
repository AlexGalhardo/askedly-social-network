"use server";

import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TelegramLog from "@/lib/telegram-logger";

export async function reportAnswer(questionId: string, reason: "offensive" | "inappropriate") {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			throw new Error("Usuário não autenticado");
		}

		const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/question/report-answer`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				questionId,
				reason,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Erro ao reportar resposta");
		}

		revalidateTag("user-session");

		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file sent-question-actions.ts reportAnswer: ${error?.message}`);
		throw new Error(error?.message);
	}
}

export async function likeAnswer(questionId: string, nickname: string) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			throw new Error("Usuário não autenticado");
		}

		const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/question/update-like`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				questionId,
				nickname,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Erro ao curtir resposta");
		}

		revalidateTag("user-session");

		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file sent-question-actions.ts likeAnswer: ${error?.message}`);
		throw new Error(error?.message);
	}
}

export async function dislikeAnswer(questionId: string, nickname: string) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			throw new Error("Usuário não autenticado");
		}

		const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/question/update-deslike`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				questionId,
				nickname,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Erro ao descurtir resposta");
		}

		revalidateTag("user-session");

		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file sent-question-actions.ts dislikeAnswer: ${error?.message}`);
		throw new Error(error?.message);
	}
}

export async function withdrawUnanswered() {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			throw new Error("Usuário não autenticado");
		}

		const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/withdraw/unanswered`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Erro ao processar saque");
		}

		revalidateTag("user-session");

		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file sent-question-actions.ts withdrawUnanswered: ${error?.message}`);
		throw new Error(error?.message);
	}
}
