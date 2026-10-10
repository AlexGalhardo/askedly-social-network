import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

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
			await TelegramLog.error("Question Delete: ❌ Question ID is required");
			return NextResponse.json({ error: t("questionIdRequired") }, { status: 400 });
		}

		const questionToDelete = await prisma.question.findUnique({
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

		if (!questionToDelete) {
			await TelegramLog.error(`Question Delete: ❌ Question with ID ${questionId} not found.`);
			return NextResponse.json({ error: t("questionNotFound") }, { status: 404 });
		}

		if (questionToDelete.owner.nickname !== nickname) {
			await TelegramLog.warning(
				`Question Delete: ❌ User @${nickname} is not authorized to delete question ${questionId}.`,
			);
			return NextResponse.json({ error: t("deleteForbidden") }, { status: 403 });
		}

		if (!questionToDelete.question_answer_was_recused && !questionToDelete.question_answer_was_expired) {
			await TelegramLog.warning(
				`Question Delete: ❌ Question ${questionId} cannot be deleted. Current status: waiting or answered.`,
			);
			return NextResponse.json({ error: t("onlyDeclinedOrExpired") }, { status: 400 });
		}

		const deletedQuestion = await prisma.question.update({
			where: { id: questionId },
			data: {
				deleted_at: new Date(),
				question_is_awaiting_answer: false,
				question_answer_was_recused: false,
				question_answer_was_expired: false,
			},
		});

		TelegramLog.info(`QUESTION DELETED:
        Question ID: ${deletedQuestion.id}
        Question Owner: @${questionToDelete.owner.nickname}
        Deleted by (User Nickname): ${nickname}
        Question Text: ${deletedQuestion.question_text}
        `);

		return NextResponse.json(
			{
				message: t("deleted"),
				question: deletedQuestion,
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Question Delete catch error: ${error?.message}`);
		return NextResponse.json({ error: te("internal") }, { status: 500 });
	}
}
