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
		const { questionId, answerText } = body;

		if (!questionId) {
			await TelegramLog.error("Question Answer: ❌ ID da pergunta é obrigatório.");
			return NextResponse.json({ error: "ID da pergunta é obrigatório" }, { status: 400 });
		}

		if (!answerText || answerText.trim().length < 32 || answerText.trim().length > 512) {
			await TelegramLog.error("Question Answer: ❌ Texto da resposta inválido.");
			return NextResponse.json(
				{ error: "Texto da resposta deve ter entre 32 e 512 caracteres" },
				{ status: 400 },
			);
		}

		const answeringUser = await prisma.user.findUnique({
			where: { nickname: nickname },
			select: { id: true, nickname: true },
		});

		if (!answeringUser) {
			await TelegramLog.error(`Question Answer: ❌ Usuário com nickname '${nickname}' não encontrado.`);
			return NextResponse.json({ error: "Usuário que está respondendo não encontrado" }, { status: 404 });
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
			await TelegramLog.error(`Question Answer: ❌ Pergunta com ID ${questionId} não encontrada.`);
			return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
		}

		if (questionToAnswer.owner.nickname !== nickname) {
			await TelegramLog.warning(
				`Question Answer: ❌ Usuário @${nickname} não autorizado a responder a pergunta ${questionId}.`,
			);
			return NextResponse.json({ error: "Você não tem permissão para responder esta pergunta" }, { status: 403 });
		}

		if (questionToAnswer.question_answered) {
			await TelegramLog.warning(`Question Answer: ❌ Pergunta ${questionId} já foi respondida.`);
			return NextResponse.json({ error: "Essa pergunta já foi respondida." }, { status: 400 });
		}

		if (questionToAnswer.question_answer_was_recused) {
			await TelegramLog.warning(
				`Question Answer: ❌ Pergunta ${questionId} foi recusada e não pode ser respondida.`,
			);
			return NextResponse.json(
				{ error: "Essa pergunta foi recusada e não pode ser respondida." },
				{ status: 400 },
			);
		}

		if (questionToAnswer.question_answer_was_expired) {
			await TelegramLog.warning(`Question Answer: ❌ Pergunta ${questionId} expirou e não pode ser respondida.`);
			return NextResponse.json({ error: "Essa pergunta expirou e não pode ser respondida." }, { status: 400 });
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

		TelegramLog.info(`PERGUNTA RESPONDIDA:
        ID da Pergunta: ${updatedQuestion.id}
        Dono da Pergunta: @${questionToAnswer.owner.nickname}
        Respondida por (Nickname do Usuário): @${nickname}
        Texto da Pergunta: ${updatedQuestion.question_text}
        Texto da Resposta: ${updatedQuestion.answer_text}
        `);

		return NextResponse.json(
			{
				message: "Resposta enviada com sucesso!",
				question: updatedQuestion,
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Question Answer catch error: ${error?.message}`);
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	}
}
