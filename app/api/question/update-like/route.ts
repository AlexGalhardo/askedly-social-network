import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

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
		const { questionId } = body;
		const { nickname } = user;

		if (!questionId) {
			return NextResponse.json({ error: t("questionIdRequired") }, { status: 400 });
		}

		const question = await prisma.question.findUnique({
			where: { id: questionId },
		});

		if (!question) {
			return NextResponse.json({ error: t("questionNotFound") }, { status: 404 });
		}

		let likedUsers = JSON.parse(question.liked_by_users ?? "[]");
		let dislikedUsers = JSON.parse(question.desliked_by_users ?? "[]");

		const userAlreadyLiked = likedUsers.some((slug: string) => slug === nickname);

		if (userAlreadyLiked) {
			likedUsers = likedUsers.filter((slug: string) => slug !== nickname);
		} else {
			likedUsers.push(nickname);
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
				message: userAlreadyLiked ? t("likeRemoved") : t("likeAdded"),
				question: updatedQuestion,
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Catch Error question-update-like.ts: ${error?.message}`);
		return NextResponse.json({ error: te("internal") }, { status: 500 });
	}
}
