import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function POST(request: NextRequest) {
	try {
		const user = await getSessionUser();
		if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

		const body = await request.json();
		const { questionId } = body;
		const { nickname } = user;

		if (!questionId) {
			return NextResponse.json({ error: "ID da pergunta é obrigatório" }, { status: 400 });
		}

		const question = await prisma.question.findUnique({
			where: { id: questionId },
		});

		if (!question) {
			return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
		}

		let likedUsers = JSON.parse(question.liked_by_users ?? "[]");
		let dislikedUsers = JSON.parse(question.desliked_by_users ?? "[]");

		const userAlreadyLiked = likedUsers.some((slug: string) => slug === nickname);

		if (userAlreadyLiked) {
			// Remove o like se já curtiu (toggle)
			likedUsers = likedUsers.filter((slug: string) => slug !== nickname);
		} else {
			// Adiciona o like
			likedUsers.push(nickname);
			// Remove do dislike se estava lá
			dislikedUsers = dislikedUsers.filter((slug: string) => slug !== nickname);
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
				message: userAlreadyLiked ? "Like removido com sucesso" : "Like adicionado com sucesso",
				question: updatedQuestion,
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Catch Error question-update-like.ts: ${error?.message}`);
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	}
}
