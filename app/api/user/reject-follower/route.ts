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

		const { requestId } = await request.json();

		if (!requestId) {
			return NextResponse.json({ message: "ID do pedido é obrigatório" }, { status: 400 });
		}

		const followRequest = await prisma.followRequest.findFirst({
			where: {
				id: requestId,
				receiverId: session.user.id,
			},
		});

		if (!followRequest) {
			return NextResponse.json({ message: "Pedido não encontrado" }, { status: 404 });
		}

		await prisma.followRequest.delete({
			where: { id: requestId },
		});

		return NextResponse.json({
			message: "Pedido rejeitado com sucesso",
		});
	} catch (error: any) {
		await TelegramLog.error(`Catch Error reject-follower.ts: ${error?.message}`);
		return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
	}
}
