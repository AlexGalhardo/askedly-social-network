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

		const { followerId } = await request.json();

		if (!followerId) {
			return NextResponse.json({ message: "ID do seguidor é obrigatório" }, { status: 400 });
		}

		const followerRelation = await prisma.follower.findMany({
			where: {
				followerId: followerId,
				followingId: session.user.id,
			},
		});

		if (!followerRelation) {
			return NextResponse.json({ message: "Relação de seguidor não encontrada" }, { status: 404 });
		}

		await prisma.follower.delete({
			where: {
				id: followerRelation[0]?.id,
			},
		});

		return NextResponse.json({
			message: "Seguidor removido com sucesso",
		});
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file remove-follower.ts: ${error?.message}`);
		return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
	}
}
