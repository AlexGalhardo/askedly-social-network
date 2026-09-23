import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
		}

		const body = await request.json();
		const { targetUserNickname } = body;

		if (!targetUserNickname) {
			return NextResponse.json({ message: "Nickname do usuário é obrigatório" }, { status: 400 });
		}

		const targetUser = await prisma.user.findUnique({
			where: { nickname: targetUserNickname },
			select: { id: true, nickname: true },
		});

		if (!targetUser) {
			return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
		}

		const existingBlock = await prisma.userBlock.findUnique({
			where: {
				blocker_id_blocked_id: {
					blocker_id: session.user.id,
					blocked_id: targetUser.id,
				},
			},
		});

		if (!existingBlock) {
			return NextResponse.json({ message: "Usuário não está bloqueado" }, { status: 400 });
		}

		await prisma.userBlock.delete({
			where: {
				blocker_id_blocked_id: {
					blocker_id: session.user.id,
					blocked_id: targetUser.id,
				},
			},
		});

		return NextResponse.json({ message: "Usuário desbloqueado com sucesso" }, { status: 200 });
	} catch (error: any) {
		await TelegramLog.error(`Catch error on /api/user/unblock: ${error}`);
		return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
	}
}
