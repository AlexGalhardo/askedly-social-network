import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { CreateQuestionError, createPaidQuestion } from "@/lib/services/question-create.service";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";
import { formatCurrency } from "@/lib/utils";

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
			pix_id,
			owner_user_id,
		} = await request.json();

		if (typeof question_text !== "string" || !question_text.trim()) {
			return NextResponse.json({ error: t("textRequired") }, { status: 400 });
		}
		if (typeof pix_id !== "string" || !pix_id) {
			return NextResponse.json({ error: t("pixIdRequired") }, { status: 400 });
		}
		if (typeof owner_user_id !== "string" || !owner_user_id) {
			return NextResponse.json({ error: t("ownerIdRequired") }, { status: 400 });
		}

		const question = await createPaidQuestion({
			askerId: user.id,
			ownerId: owner_user_id,
			pixId: pix_id,
			questionText: question_text,
			isAnonymous: Boolean(is_anonymous),
			askerWantsPrivateAnswer: Boolean(asker_want_answer_to_be_private),
			amountIsPrivate: Boolean(amount_paid_is_private),
		});

		await TelegramLog.info(`NEW QUESTION CREATED SUCCESSFULLY!

		NICKNAME OF WHO RECEIVED THE QUESTION: @${question.owner.nickname}
		PIX_ID: ${pix_id}
		PAID: ${formatCurrency(question.amount_paid)}
		QUESTION: ${question.question_text}
		WHO SENT THE QUESTION: @${question.asked_by.nickname}
		SENT PRIVATE QUESTION: ${question.asker_want_answer_to_be_private}
		SENT ANONYMOUS QUESTION: ${question.asker_sent_anonymous_question}
		`);

		return NextResponse.json({ message: t("created"), question }, { status: 201 });
	} catch (error: unknown) {
		if (error instanceof CreateQuestionError) {
			return NextResponse.json({ error: tc(error.message) }, { status: error.status });
		}
		await TelegramLog.error(`Question Create: ❌ ${(error as Error)?.message}`);
		return NextResponse.json({ error: te("internal") }, { status: 500 });
	}
}
