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

		// Verificar se o usuário alvo existe
		const targetUser = await prisma.user.findUnique({
			where: { nickname: targetUserNickname },
			select: { id: true, nickname: true },
		});

		if (!targetUser) {
			return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
		}

		// Verificar se não está tentando bloquear a si mesmo
		if (session.user.id === targetUser.id) {
			return NextResponse.json({ message: "Você não pode bloquear a si mesmo" }, { status: 400 });
		}

		// Verificar se já não bloqueou esse usuário
		const existingBlock = await prisma.userBlock.findUnique({
			where: {
				blocker_id_blocked_id: {
					blocker_id: session.user.id,
					blocked_id: targetUser.id,
				},
			},
		});

		if (existingBlock) {
			return NextResponse.json({ message: "Usuário já está bloqueado" }, { status: 400 });
		}

		// Criar o bloqueio
		await prisma.userBlock.create({
			data: {
				blocker_id: session.user.id,
				blocked_id: targetUser.id,
			},
		});

		// Opcional: Remover seguidor/seguindo se existir
		await prisma.follower.deleteMany({
			where: {
				OR: [
					{
						followerId: session.user.id,
						followingId: targetUser.id,
					},
					{
						followerId: targetUser.id,
						followingId: session.user.id,
					},
				],
			},
		});

		await prisma.followRequest.deleteMany({
			where: {
				OR: [
					{
						senderId: session.user.id,
						receiverId: targetUser.id,
					},
					{
						senderId: targetUser.id,
						receiverId: session.user.id,
					},
				],
			},
		});

		return NextResponse.json({ message: "Usuário bloqueado com sucesso" }, { status: 200 });
	} catch (error: any) {
		await TelegramLog.error(`Catch Error user-block.ts: ${error?.message}`);
		return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
	}
}
