"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TelegramLog from "@/lib/telegram-logger";

// A chamada servidor→servidor não herda os cookies do navegador; sem repassá-los a rota não enxerga a sessão.
async function forwardedHeaders(): Promise<HeadersInit> {
	return { "Content-Type": "application/json", cookie: (await headers()).get("cookie") ?? "" };
}

export async function reportAnswer(questionId: string, reason: "offensive" | "inappropriate") {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			throw new Error("Usuário não autenticado");
		}

		const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/question/report-answer`, {
			method: "POST",
			headers: await forwardedHeaders(),
			body: JSON.stringify({
				questionId,
				reason,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Erro ao reportar resposta");
		}

		updateTag("user-session");

		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file sent-question-actions.ts reportAnswer: ${error?.message}`);
		throw new Error(error?.message);
	}
}

export async function likeAnswer(questionId: string) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			throw new Error("Usuário não autenticado");
		}

		const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/question/update-like`, {
			method: "POST",
			headers: await forwardedHeaders(),
			body: JSON.stringify({ questionId }),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Erro ao curtir resposta");
		}

		updateTag("user-session");

		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file sent-question-actions.ts likeAnswer: ${error?.message}`);
		throw new Error(error?.message);
	}
}

export async function dislikeAnswer(questionId: string) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			throw new Error("Usuário não autenticado");
		}

		const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/question/update-deslike`, {
			method: "POST",
			headers: await forwardedHeaders(),
			body: JSON.stringify({ questionId }),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Erro ao descurtir resposta");
		}

		updateTag("user-session");

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
			headers: await forwardedHeaders(),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || "Erro ao processar saque");
		}

		updateTag("user-session");

		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file sent-question-actions.ts withdrawUnanswered: ${error?.message}`);
		throw new Error(error?.message);
	}
}
