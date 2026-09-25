import { NextRequest, NextResponse } from "next/server";
import { reportQuestion } from "@/lib/services/question-report.service";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";

export async function POST(request: NextRequest) {
	try {
		const user = await getSessionUser();
		if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

		const { questionId, isOffensive, isInappropriate } = await request.json();
		if (typeof questionId !== "string" || (!isOffensive && !isInappropriate)) {
			return NextResponse.json({ error: "Pergunta e motivo do report são obrigatórios" }, { status: 400 });
		}

		const reason = isOffensive ? "offensive" : "inappropriate";
		if (!(await reportQuestion(questionId, user.nickname, reason))) {
			return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
		}

		await TelegramLog.info(`PERGUNTA REPORTADA: ${questionId} por @${user.nickname} (${reason})`);
		return NextResponse.json({ message: "Pergunta reportada com sucesso" });
	} catch (error: unknown) {
		await TelegramLog.error(`Question Report catch error: ${error instanceof Error ? error.message : error}`);
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	}
}
