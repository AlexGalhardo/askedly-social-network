import { NextRequest, NextResponse } from "next/server";
import { expireQuestion } from "@/lib/services/question-expiry.service";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";

export async function POST(request: NextRequest) {
	try {
		const user = await getSessionUser();
		if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

		const { questionId } = await request.json();
		if (typeof questionId !== "string") {
			return NextResponse.json({ error: "ID da pergunta é obrigatório" }, { status: 400 });
		}

		if (!(await expireQuestion(questionId, user.nickname))) {
			return NextResponse.json({ error: "Pergunta não pode ser expirada" }, { status: 409 });
		}

		return NextResponse.json({ success: true, message: "Pergunta expirada com sucesso" }, { status: 200 });
	} catch (error: unknown) {
		await TelegramLog.error(`Catch Error question-expired.ts: ${(error as Error)?.message}`);
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	}
}
