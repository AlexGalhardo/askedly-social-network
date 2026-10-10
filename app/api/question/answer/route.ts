import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

import { settleCreditQuestion } from "@/lib/services/stripe-connect.service";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function POST(request: NextRequest) {
	const te = await getTranslations("errors");
	const t = await getTranslations("questions.api");

	try {
		const user = await getSessionUser();
		if (!user) return NextResponse.json({ error: te("unauthorized") }, { status: 401 });

		const body = await request.json();
		const { nickname } = user;
		const { questionId, answerText } = body;

		if (!questionId) {
			await TelegramLog.error("Question Answer: ❌ Question ID is required.");
			return NextResponse.json({ error: t("questionIdRequired") }, { status: 400 });
		}

		if (!answerText || answerText.trim().length < 32 || answerText.trim().length > 512) {
			await TelegramLog.error("Question Answer: ❌ Invalid answer text.");
			return NextResponse.json({ error: t("answerLength") }, { status: 400 });
		}

		const answeringUser = await prisma.user.findUnique({
			where: { nickname: nickname },
			select: { id: true, nickname: true },
		});

		if (!answeringUser) {
			await TelegramLog.error(`Question Answer: ❌ User with nickname '${nickname}' not found.`);
			return NextResponse.json({ error: t("answererNotFound") }, { status: 404 });
		}

		const questionToAnswer = await prisma.question.findUnique({
			where: { id: questionId },
			include: {
				owner: {
					select: {
						id: true,
						nickname: true,
					},
				},
			},
		});

		if (!questionToAnswer) {
			await TelegramLog.error(`Question Answer: ❌ Question with ID ${questionId} not found.`);
			return NextResponse.json({ error: t("questionNotFound") }, { status: 404 });
		}

		if (questionToAnswer.owner.nickname !== nickname) {
			await TelegramLog.warning(
				`Question Answer: ❌ User @${nickname} is not authorized to answer question ${questionId}.`,
			);
			return NextResponse.json({ error: t("answerForbidden") }, { status: 403 });
		}

		if (questionToAnswer.question_answered) {
			await TelegramLog.warning(`Question Answer: ❌ Question ${questionId} has already been answered.`);
			return NextResponse.json({ error: t("alreadyAnswered") }, { status: 400 });
		}

		if (questionToAnswer.question_answer_was_recused) {
			await TelegramLog.warning(
				`Question Answer: ❌ Question ${questionId} was declined and cannot be answered.`,
			);
			return NextResponse.json({ error: t("declinedCannotAnswer") }, { status: 400 });
		}

		if (questionToAnswer.question_answer_was_expired) {
			await TelegramLog.warning(`Question Answer: ❌ Question ${questionId} expired and cannot be answered.`);
			return NextResponse.json({ error: t("expiredCannotAnswer") }, { status: 400 });
		}

		const updatedQuestion = await prisma.question.update({
			where: { id: questionId },
			data: {
				answer_text: answerText.trim(),
				answered_at: new Date(),
				question_answered: true,
				question_is_awaiting_answer: false,
				updated_at: new Date(),
			},
		});

		await settleCreditQuestion(questionId);

		TelegramLog.info(`QUESTION ANSWERED:
        Question ID: ${updatedQuestion.id}
        Question Owner: @${questionToAnswer.owner.nickname}
        Answered by (User Nickname): @${nickname}
        Question Text: ${updatedQuestion.question_text}
        Answer Text: ${updatedQuestion.answer_text}
        `);

		return NextResponse.json(
			{
				message: t("answerSent"),
				question: updatedQuestion,
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Question Answer catch error: ${error?.message}`);
		return NextResponse.json({ error: te("internal") }, { status: 500 });
	}
}
