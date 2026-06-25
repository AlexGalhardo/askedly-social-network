import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import TelegramLog from "@/lib/telegram-logger";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { questionId, nickname } = body;

		if (!questionId) {
			await TelegramLog.error("Question Delete: ❌ ID da pergunta é obrigatório");
			return NextResponse.json({ error: "ID da pergunta é obrigatório" }, { status: 400 });
		}

		if (!nickname) {
			await TelegramLog.error("Question Delete: ❌ ID do usuário é obrigatório");
			return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 });
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
			return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
		}

		if (questionToDelete.owner.nickname !== nickname) {
			await TelegramLog.warning(
				`Question Delete: ❌ Usuário @${nickname} não autorizado a deletar a pergunta ${questionId}.`,
			);
			return NextResponse.json({ error: "Você não tem permissão para deletar esta pergunta" }, { status: 403 });
		}

		if (!questionToDelete.question_answer_was_recused && !questionToDelete.question_answer_was_expired) {
			await TelegramLog.warning(
				`Question Delete: ❌ Pergunta ${questionId} não pode ser deletada. Status atual: aguardando ou respondida.`,
			);
			return NextResponse.json(
				{ error: "Apenas perguntas recusadas ou expiradas podem ser deletadas" },
				{ status: 400 },
			);
		}

		const deletedQuestion = await prisma.question.update({
			where: { id: questionId },
			data: {
				deleted_at: new Date(),
				question_is_awaiting_answer: false,
				question_answer_was_recused: false,
				question_answer_was_expired: false,
				// question_deleted_at: new Date(),
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
				message: "Pergunta deletada com sucesso",
				question: deletedQuestion,
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Question Delete catch error: ${error?.message}`);
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}
