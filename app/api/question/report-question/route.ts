// app/api/question/report-question/route.ts

import { NextRequest, NextResponse } from "next/server";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { questionId, nickname, isOffensive, isInappropriate } = body;

		if (!questionId) {
			await TelegramLog.error("Question Report: ❌ ID da pergunta é obrigatório.");
			return NextResponse.json({ error: "ID da pergunta é obrigatório" }, { status: 400 });
		}

		if (!nickname) {
			await TelegramLog.error("Question Report: ❌ Nickname do usuário é obrigatório.");
			return NextResponse.json({ error: "Nickname do usuário é obrigatório" }, { status: 400 });
		}

		if (!isOffensive && !isInappropriate) {
			await TelegramLog.error("Question Report: ❌ Tipo de report não especificado.");
			return NextResponse.json(
				{ error: "Tipo de report (ofensivo ou inapropriado) é obrigatório" },
				{ status: 400 },
			);
		}

		const reportingUser = await prisma.user.findUnique({
			where: { nickname: nickname },
			select: { id: true, nickname: true },
		});

		if (!reportingUser) {
			await TelegramLog.error(`Question Report: ❌ Usuário com nickname '${nickname}' não encontrado.`);
			return NextResponse.json({ error: "Usuário que está reportando não encontrado" }, { status: 404 });
		}

		const questionToReport = await prisma.question.findUnique({
			where: { id: questionId },
			select: {
				id: true,
				question_text: true,
				owner_reported_offensive_question: true,
				onwer_reported_inadequate_question: true,
				owner_user_nickname: true,
			},
		});

		if (!questionToReport) {
			await TelegramLog.error(`Question Report: ❌ Pergunta com ID ${questionId} não encontrada.`);
			return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
		}

		if (isOffensive && questionToReport.owner_reported_offensive_question) {
			await TelegramLog.warning(
				`Question Report: ❌ Pergunta ${questionId} já foi reportada como ofensiva pelo proprietário @${nickname}.`,
			);
			return NextResponse.json({ error: "Você já reportou esta pergunta como ofensiva." }, { status: 400 });
		}

		if (isInappropriate && questionToReport.onwer_reported_inadequate_question) {
			await TelegramLog.warning(
				`Question Report: ❌ Pergunta ${questionId} já foi reportada como inapropriada pelo proprietário @${nickname}.`,
			);
			return NextResponse.json({ error: "Você já reportou esta pergunta como inapropriada." }, { status: 400 });
		}

		// --- Atualização dos Campos Booleanos ---
		const updateData: {
			owner_reported_offensive_question?: boolean;
			onwer_reported_inadequate_question?: boolean;
			updated_at: Date;
		} = { updated_at: new Date() };

		if (isOffensive) {
			updateData.owner_reported_offensive_question = true;
		}
		if (isInappropriate) {
			updateData.onwer_reported_inadequate_question = true;
		}

		const updatedQuestion = await prisma.question.update({
			where: { id: questionId },
			data: { ...updateData, question_is_awaiting_answer: false },
		});

		const reportReasonText = isOffensive ? "Ofensiva" : isInappropriate ? "Inapropriada" : "Desconhecido";

		TelegramLog.info(`PERGUNTA REPORTADA PELO PROPRIETÁRIO:
        ID da Pergunta: ${updatedQuestion.id}
        Dono da Pergunta: @${questionToReport.owner_user_nickname}
        Reportada por (Nickname do Proprietário): @${nickname}
        Motivo: ${reportReasonText}
        Texto da Pergunta: ${updatedQuestion.question_text}
        Status de Reporte: Ofensiva=${updatedQuestion.owner_reported_offensive_question}, Inapropriada=${updatedQuestion.onwer_reported_inadequate_question}
        `);

		return NextResponse.json(
			{
				message: "Pergunta reportada com sucesso",
				question: {
					id: updatedQuestion.id,
					owner_reported_offensive_question: updatedQuestion.owner_reported_offensive_question,
					onwer_reported_inadequate_question: updatedQuestion.onwer_reported_inadequate_question,
				},
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Question Report catch error: ${error?.message}`);
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	}
}
