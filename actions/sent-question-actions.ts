"use server";

import { updateTag } from "next/cache";
import { getTranslations } from "next-intl/server";

import { type ReportReason, reportAnswer as reportAnswerAsAsker } from "@/lib/services/question-report.service";
import { getSessionUser } from "@/lib/session";

export async function reportAnswer(questionId: string, reason: ReportReason): Promise<{ success: true }> {
	const user = await getSessionUser();
	const te = await getTranslations("errors");
	if (!user) throw new Error(te("unauthorized"));

	if (reason !== "offensive" && reason !== "inappropriate") throw new Error(te("invalidData"));

	if (!(await reportAnswerAsAsker(questionId, user.nickname, reason))) {
		throw new Error((await getTranslations("questions.api"))("cannotReportAnswer"));
	}

	updateTag("user-session");
	return { success: true };
}
