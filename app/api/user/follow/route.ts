import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import TelegramLog from "@/lib/telegram-logger";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { followingId, followerId } = body;

		if (!followingId || !followerId) {
			return NextResponse.json({ error: "IDs do seguidor e seguido são obrigatórios" }, { status: 400 });
		}

		const [followerUser, followingUser] = await Promise.all([
			prisma.user.findUnique({ where: { id: followerId } }),
			prisma.user.findUnique({ where: { id: followingId } }),
		]);

		if (!followerUser || !followingUser) {
			return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
		}

		if (followerId === followingId) {
			return NextResponse.json({ error: "Você não pode seguir a si mesmo" }, { status: 400 });
		}

		// Verificar se já está seguindo
		const existingFollow = await prisma.follower.findUnique({
			where: {
				followerId_followingId: {
					followerId,
					followingId,
				},
			},
		});

		// Verificar se já existe uma solicitação pendente
		const existingRequest = await prisma.followRequest.findUnique({
			where: {
				senderId_receiverId: {
					senderId: followerId,
					receiverId: followingId,
				},
			},
		});

		let isFollowing = !!existingFollow;
		let hasPendingRequest = !!existingRequest;
		let message: string;

		// Se já está seguindo, desseguir
		if (existingFollow) {
			await prisma.follower.delete({
				where: {
					id: existingFollow.id,
				},
			});
			isFollowing = false;
			message = "Usuário desseguido com sucesso";
		}
		// Se tem solicitação pendente, cancelar
		else if (existingRequest) {
			await prisma.followRequest.delete({
				where: {
					id: existingRequest.id,
				},
			});
			hasPendingRequest = false;
			message = "Solicitação de seguir cancelada";
		}
		// Se não está seguindo nem tem solicitação pendente
		else {
			// Se o perfil é privado, criar solicitação
			if (followingUser.privacy_is_private_profile) {
				await prisma.followRequest.create({
					data: {
						senderId: followerId,
						receiverId: followingId,
					},
				});
				hasPendingRequest = true;
				message = "Solicitação para seguir enviada";
			}
			// Se o perfil é público, seguir diretamente
			else {
				await prisma.follower.create({
					data: {
						followerId,
						followingId,
					},
				});
				isFollowing = true;
				message = "Usuário seguido com sucesso";
			}
		}

		return NextResponse.json(
			{
				message,
				isFollowing,
				hasPendingRequest,
				followerId,
				followingId,
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Catch Error user-follow.ts: ${error?.message}`);
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	} finally {
		await prisma.$disconnect();
	}
}
