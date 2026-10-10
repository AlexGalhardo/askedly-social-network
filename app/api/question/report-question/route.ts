import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { reportQuestion } from "@/lib/services/question-report.service";
import { settleCreditQuestion } from "@/lib/services/stripe-connect.service";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";

export async function POST(request: NextRequest) {
	const te = await getTranslations("errors");
	const t = await getTranslations("questions.api");

	try {
		const user = await getSessionUser();
		if (!user) return NextResponse.json({ error: te("unauthorized") }, { status: 401 });

		const { questionId, isOffensive, isInappropriate } = await request.json();
		if (typeof questionId !== "string" || (!isOffensive && !isInappropriate)) {
			return NextResponse.json({ error: t("reportFieldsRequired") }, { status: 400 });
		}

		const reason = isOffensive ? "offensive" : "inappropriate";
		if (!(await reportQuestion(questionId, user.nickname, reason))) {
			return NextResponse.json({ error: t("questionNotFound") }, { status: 404 });
		}

		await settleCreditQuestion(questionId);

		await TelegramLog.info(`PERGUNTA REPORTADA: ${questionId} por @${user.nickname} (${reason})`);
		return NextResponse.json({ message: t("reported") });
	} catch (error: unknown) {
		await TelegramLog.error(`Question Report catch error: ${error instanceof Error ? error.message : error}`);
		return NextResponse.json({ error: te("internal") }, { status: 500 });
	}
}
