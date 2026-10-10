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
			await TelegramLog.error("Question Delete: ❌ ID da pergunta é obrigatório");
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
			await TelegramLog.error(`Question Delete: ❌ Pergunta com ID ${questionId} não encontrada.`);
			return NextResponse.json({ error: t("questionNotFound") }, { status: 404 });
		}

		if (questionToDelete.owner.nickname !== nickname) {
			await TelegramLog.warning(
				`Question Delete: ❌ Usuário @${nickname} não autorizado a deletar a pergunta ${questionId}.`,
			);
			return NextResponse.json({ error: t("deleteForbidden") }, { status: 403 });
		}

		if (!questionToDelete.question_answer_was_recused && !questionToDelete.question_answer_was_expired) {
			await TelegramLog.warning(
				`Question Delete: ❌ Pergunta ${questionId} não pode ser deletada. Status atual: aguardando ou respondida.`,
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

		TelegramLog.info(`PERGUNTA DELETADA:
        ID da Pergunta: ${deletedQuestion.id}
        Dono da Pergunta: @${questionToDelete.owner.nickname}
        Deletada por (Nickname do Usuário): ${nickname}
        Texto da Pergunta: ${deletedQuestion.question_text}
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
