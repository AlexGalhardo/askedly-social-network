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
		const { questionId } = body;

		if (!questionId) {
			await TelegramLog.error("Question Recused: ❌ Question ID is required.");
			return NextResponse.json({ error: t("questionIdRequired") }, { status: 400 });
		}

		const recusingUser = await prisma.user.findUnique({
			where: { nickname: nickname },
			select: { id: true, nickname: true },
		});

		if (!recusingUser) {
			await TelegramLog.error(`Question Recused: ❌ User with nickname '${nickname}' not found.`);
			return NextResponse.json({ error: t("userNotFound") }, { status: 404 });
		}

		const questionToRecuse = await prisma.question.findUnique({
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

		if (!questionToRecuse) {
			await TelegramLog.error(`Question Recused: ❌ Question with ID ${questionId} not found.`);
			return NextResponse.json({ error: t("questionNotFound") }, { status: 404 });
		}

		if (questionToRecuse.owner.nickname !== nickname) {
			await TelegramLog.warning(
				`Question Recused: ❌ User @${nickname} is not authorized to decline question ${questionId}.`,
			);
			return NextResponse.json({ error: t("declineForbidden") }, { status: 403 });
		}

		if (questionToRecuse.answered_at) {
			await TelegramLog.warning(
				`Question Recused: ❌ Question ${questionId} has already been answered. It cannot be declined.`,
			);
			return NextResponse.json({ error: t("answeredCannotDecline") }, { status: 400 });
		}

		if (questionToRecuse.question_answer_was_expired) {
			await TelegramLog.warning(
				`Question Recused: ❌ Question ${questionId} has already expired. It cannot be declined.`,
			);
			return NextResponse.json({ error: t("expiredCannotDecline") }, { status: 400 });
		}

		if (questionToRecuse.question_answer_was_recused) {
			await TelegramLog.warning(`Question Recused: ❌ Question ${questionId} has already been declined.`);
			return NextResponse.json({ error: t("alreadyDeclined") }, { status: 400 });
		}

		const updatedQuestion = await prisma.question.update({
			where: { id: questionId },
			data: {
				question_answer_was_recused: true,
				question_is_awaiting_answer: false,
				updated_at: new Date(),
			},
		});

		await settleCreditQuestion(questionId);

		TelegramLog.info(`QUESTION DECLINED:
        Question ID: ${updatedQuestion.id}
        Question Owner: @${questionToRecuse.owner.nickname}
        Declined by (User Nickname): @${nickname}
        Question Text: ${updatedQuestion.question_text}
        `);

		return NextResponse.json(
			{
				message: t("declined"),
				question: updatedQuestion,
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Question Recused catch error: ${error?.message}`);
		return NextResponse.json({ error: te("internal") }, { status: 500 });
	}
}
