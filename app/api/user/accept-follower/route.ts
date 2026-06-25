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

		const existingFollower = await prisma.follower.findFirst({
			where: {
				followerId: followRequest.senderId,
				followingId: session.user.id,
			},
		});

		if (existingFollower) {
			await prisma.followRequest.delete({
				where: { id: requestId },
			});

			return NextResponse.json({ message: "Usuário já é seguidor" }, { status: 400 });
		}

		await prisma.$transaction([
			prisma.follower.create({
				data: {
					followerId: followRequest.senderId,
					followingId: session.user.id,
				},
			}),
			prisma.followRequest.delete({
				where: { id: requestId },
			}),
		]);

		return NextResponse.json({
			message: "Seguidor aceito com sucesso",
		});
	} catch (error: any) {
		await TelegramLog.error(`Catch Error accept-follower.ts: ${error?.message}`);
		return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
	}
}
