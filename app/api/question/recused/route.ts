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
			await TelegramLog.error("Question Recused: ❌ ID da pergunta é obrigatório.");
			return NextResponse.json({ error: t("questionIdRequired") }, { status: 400 });
		}

		const recusingUser = await prisma.user.findUnique({
			where: { nickname: nickname },
			select: { id: true, nickname: true },
		});

		if (!recusingUser) {
			await TelegramLog.error(`Question Recused: ❌ Usuário com nickname '${nickname}' não encontrado.`);
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
			await TelegramLog.error(`Question Recused: ❌ Pergunta com ID ${questionId} não encontrada.`);
			return NextResponse.json({ error: t("questionNotFound") }, { status: 404 });
		}

		if (questionToRecuse.owner.nickname !== nickname) {
			await TelegramLog.warning(
				`Question Recused: ❌ Usuário @${nickname} não autorizado a recusar a pergunta ${questionId}.`,
			);
			return NextResponse.json({ error: t("declineForbidden") }, { status: 403 });
		}

		if (questionToRecuse.answered_at) {
			await TelegramLog.warning(
				`Question Recused: ❌ Pergunta ${questionId} já foi respondida. Não pode ser recusada.`,
			);
			return NextResponse.json({ error: t("answeredCannotDecline") }, { status: 400 });
		}

		if (questionToRecuse.question_answer_was_expired) {
			await TelegramLog.warning(`Question Recused: ❌ Pergunta ${questionId} já expirou. Não pode ser recusada.`);
			return NextResponse.json({ error: t("expiredCannotDecline") }, { status: 400 });
		}

		if (questionToRecuse.question_answer_was_recused) {
			await TelegramLog.warning(`Question Recused: ❌ Pergunta ${questionId} já foi recusada.`);
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

		TelegramLog.info(`PERGUNTA RECUSADA:
        ID da Pergunta: ${updatedQuestion.id}
        Dono da Pergunta: @${questionToRecuse.owner.nickname}
        Recusada por (Nickname do Usuário): @${nickname}
        Texto da Pergunta: ${updatedQuestion.question_text}
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
