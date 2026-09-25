import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function POST(request: NextRequest) {
	try {
		const user = await getSessionUser();
		if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

		const body = await request.json();
		const { followingId } = body;
		const followerId = user.id;

		if (!followingId) {
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

		const existingFollow = await prisma.follower.findUnique({
			where: {
				followerId_followingId: {
					followerId,
					followingId,
				},
			},
		});

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

		if (existingFollow) {
			await prisma.follower.delete({
				where: {
					id: existingFollow.id,
				},
			});
			isFollowing = false;
			message = "Usuário desseguido com sucesso";
		} else if (existingRequest) {
			await prisma.followRequest.delete({
				where: {
					id: existingRequest.id,
				},
			});
			hasPendingRequest = false;
			message = "Solicitação de seguir cancelada";
		} else {
			if (followingUser.privacy_is_private_profile) {
				await prisma.followRequest.create({
					data: {
						senderId: followerId,
						receiverId: followingId,
					},
				});
				hasPendingRequest = true;
				message = "Solicitação para seguir enviada";
			} else {
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
	}
}
