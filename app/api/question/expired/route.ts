import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { expireQuestion } from "@/lib/services/question-expiry.service";
import { settleCreditQuestion } from "@/lib/services/stripe-connect.service";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";

export async function POST(request: NextRequest) {
	const te = await getTranslations("errors");
	const t = await getTranslations("questions.api");

	try {
		const user = await getSessionUser();
		if (!user) return NextResponse.json({ error: te("unauthorized") }, { status: 401 });

		const { questionId } = await request.json();
		if (typeof questionId !== "string") {
			return NextResponse.json({ error: t("questionIdRequired") }, { status: 400 });
		}

		if (!(await expireQuestion(questionId, user.nickname))) {
			return NextResponse.json({ error: t("cannotExpire") }, { status: 409 });
		}

		await settleCreditQuestion(questionId);

		return NextResponse.json({ success: true, message: t("expired") }, { status: 200 });
	} catch (error: unknown) {
		await TelegramLog.error(`Catch Error question-expired.ts: ${(error as Error)?.message}`);
		return NextResponse.json({ error: te("internal") }, { status: 500 });
	}
}
