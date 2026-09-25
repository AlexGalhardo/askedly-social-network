import { NextRequest, NextResponse } from "next/server";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { questionId, nickname } = body;

		if (!questionId || !nickname) {
			return NextResponse.json({ error: "ID da pergunta e nickname são obrigatórios" }, { status: 400 });
		}

		const question = await prisma.question.findUnique({
			where: { id: questionId },
		});

		if (!question) {
			return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
		}

		let likedUsers = JSON.parse(question.liked_by_users ?? "[]");
		let dislikedUsers = JSON.parse(question.desliked_by_users ?? "[]");

		const userAlreadyDisliked = dislikedUsers.some((slug: string) => slug === nickname);

		if (userAlreadyDisliked) {
			dislikedUsers = dislikedUsers.filter((slug: string) => slug !== nickname);
		} else {
			dislikedUsers.push(nickname);
			likedUsers = likedUsers.filter((slug: string) => slug !== nickname);
		}

		const updatedQuestion = await prisma.question.update({
			where: { id: questionId },
			data: {
				liked_by_users: JSON.stringify(likedUsers),
				desliked_by_users: JSON.stringify(dislikedUsers),
			},
		});

		return NextResponse.json(
			{
				message: userAlreadyDisliked ? "Dislike removido com sucesso" : "Dislike adicionado com sucesso",
				question: updatedQuestion,
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Catch Error question-update-like.ts: ${error?.message}`);
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	}
}
