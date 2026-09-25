// app/api/question/recused/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function POST(request: NextRequest) {
	try {
		const user = await getSessionUser();
		if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

		const body = await request.json();
		const { nickname } = user;
		const { questionId } = body;

		if (!questionId) {
			await TelegramLog.error("Question Recused: ❌ ID da pergunta é obrigatório.");
			return NextResponse.json({ error: "ID da pergunta é obrigatório" }, { status: 400 });
		}

		const recusingUser = await prisma.user.findUnique({
			where: { nickname: nickname },
			select: { id: true, nickname: true },
		});

		if (!recusingUser) {
			await TelegramLog.error(`Question Recused: ❌ Usuário com nickname '${nickname}' não encontrado.`);
			return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
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
			return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
		}

		if (questionToRecuse.owner.nickname !== nickname) {
			await TelegramLog.warning(
				`Question Recused: ❌ Usuário @${nickname} não autorizado a recusar a pergunta ${questionId}.`,
			);
			return NextResponse.json({ error: "Você não tem permissão para recusar esta pergunta" }, { status: 403 });
		}

		if (questionToRecuse.answered_at) {
			await TelegramLog.warning(
				`Question Recused: ❌ Pergunta ${questionId} já foi respondida. Não pode ser recusada.`,
			);
			return NextResponse.json(
				{ error: "Essa pergunta já foi respondida e não pode ser recusada." },
				{ status: 400 },
			);
		}

		if (questionToRecuse.question_answer_was_expired) {
			await TelegramLog.warning(`Question Recused: ❌ Pergunta ${questionId} já expirou. Não pode ser recusada.`);
			return NextResponse.json({ error: "Essa pergunta já expirou e não pode ser recusada." }, { status: 400 });
		}

		if (questionToRecuse.question_answer_was_recused) {
			await TelegramLog.warning(`Question Recused: ❌ Pergunta ${questionId} já foi recusada.`);
			return NextResponse.json({ error: "Essa pergunta já foi recusada." }, { status: 400 });
		}

		const updatedQuestion = await prisma.question.update({
			where: { id: questionId },
			data: {
				question_answer_was_recused: true,
				question_is_awaiting_answer: false,
				updated_at: new Date(),
			},
		});

		TelegramLog.info(`PERGUNTA RECUSADA:
        ID da Pergunta: ${updatedQuestion.id}
        Dono da Pergunta: @${questionToRecuse.owner.nickname}
        Recusada por (Nickname do Usuário): @${nickname}
        Texto da Pergunta: ${updatedQuestion.question_text}
        `);

		return NextResponse.json(
			{
				message: "Pergunta recusada com sucesso",
				question: updatedQuestion,
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Question Recused catch error: ${error?.message}`);
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	}
}
