import { NextRequest, NextResponse } from "next/server";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { questionId } = body;

		await prisma.question.update({
			where: {
				id: questionId,
			},
			data: {
				question_is_awaiting_answer: false,
				question_answer_was_expired: true,
				question_answer_was_recused: false,
			},
		});

		return NextResponse.json(
			{
				success: true,
				message: "Pergunta expirada com sucesso",
			},
			{ status: 201 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Catch Error question-expired.ts: ${error?.message}`);

		if (error.code === "P2002") {
			return NextResponse.json({ error: "Já existe uma pergunta com este PIX ID" }, { status: 400 });
		}

		if (error.code === "P2003") {
			return NextResponse.json({ error: "Referência inválida - verifique os IDs fornecidos" }, { status: 400 });
		}

		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}
