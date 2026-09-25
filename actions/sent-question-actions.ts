"use server";

import { updateTag } from "next/cache";
import { type ReportReason, reportAnswer as reportAnswerAsAsker } from "@/lib/services/question-report.service";
import { getSessionUser } from "@/lib/session";

export async function reportAnswer(questionId: string, reason: ReportReason): Promise<{ success: true }> {
	const user = await getSessionUser();
	if (!user) throw new Error("Usuário não autenticado");

	if (reason !== "offensive" && reason !== "inappropriate") throw new Error("Motivo inválido");

	if (!(await reportAnswerAsAsker(questionId, user.nickname, reason))) {
		throw new Error("Não foi possível reportar esta resposta");
	}

	updateTag("user-session");
	return { success: true };
}
