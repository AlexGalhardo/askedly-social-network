import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/prisma/prisma-client";
import TelegramLog from "@/lib/telegram-logger";

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
		}

		const { followingId } = await request.json();

		if (!followingId) {
			return NextResponse.json({ message: "ID da pessoa a deixar de seguir é obrigatório" }, { status: 400 });
		}

		const followerRelation = await prisma.follower.findMany({
			where: {
				followerId: session.user.id,
				followingId: followingId,
			},
		});

		if (!followerRelation || followerRelation.length === 0) {
			return NextResponse.json({ message: "Relação de seguidor não encontrada" }, { status: 404 });
		}

		await prisma.follower.delete({
			where: {
				id: followerRelation[0].id,
			},
		});

		return NextResponse.json({
			message: "Deixou de seguir com sucesso",
		});
	} catch (error: any) {
		await TelegramLog.error(`Catch Error unfollow.ts: ${error?.message}`);
		return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
	}
}
