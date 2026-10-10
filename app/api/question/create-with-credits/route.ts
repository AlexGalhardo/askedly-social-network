import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { CreateQuestionError, createCreditQuestion } from "@/lib/services/question-create.service";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";

export async function POST(request: NextRequest) {
	const te = await getTranslations("errors");
	const t = await getTranslations("questions.api");
	const tc = await getTranslations("questions.createErrors");

	try {
		const user = await getSessionUser();
		if (!user) return NextResponse.json({ error: te("unauthorized") }, { status: 401 });

		const {
			question_text,
			is_anonymous,
			asker_want_answer_to_be_private,
			amount_paid_is_private,
			amount,
			owner_user_id,
		} = await request.json();

		if (typeof question_text !== "string" || !question_text.trim()) {
			return NextResponse.json({ error: t("textRequired") }, { status: 400 });
		}
		if (typeof owner_user_id !== "string" || !owner_user_id) {
			return NextResponse.json({ error: t("ownerIdRequired") }, { status: 400 });
		}

		const question = await createCreditQuestion({
			askerId: user.id,
			ownerId: owner_user_id,
			amountCents: amount,
			questionText: question_text,
			isAnonymous: Boolean(is_anonymous),
			askerWantsPrivateAnswer: Boolean(asker_want_answer_to_be_private),
			amountIsPrivate: Boolean(amount_paid_is_private),
		});

		await TelegramLog.info(
			`NOVA PERGUNTA (créditos): @${question.asked_by.nickname} -> @${question.owner.nickname}, US$ ${question.amount_paid / 100}`,
		);

		return NextResponse.json({ message: t("created"), question }, { status: 201 });
	} catch (error: unknown) {
		if (error instanceof CreateQuestionError) {
			return NextResponse.json({ error: tc(error.message) }, { status: error.status });
		}
		await TelegramLog.error(`Question Create (credits): ❌ ${(error as Error)?.message}`);
		return NextResponse.json({ error: te("internal") }, { status: 500 });
	}
}
