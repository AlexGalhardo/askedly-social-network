"use server";

import { updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function removeFollower(followerId: string) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			throw new Error("Usuário não autenticado");
		}

		await prisma.follower.deleteMany({
			where: {
				followerId: followerId,
				followingId: session.user.id,
			},
		});

		updateTag("user-session");

		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Error follower-actions.ts ${error?.message}`);
		throw new Error(error?.message);
	}
}

export async function acceptFollowRequest(requestId: string) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			await TelegramLog.error(`Error follower-actions.ts usuário não autenticado`);
			throw new Error("Usuário não autenticado");
		}

		const request = await prisma.followRequest.findFirst({
			where: { id: requestId, receiverId: session.user.id },
		});

		if (!request) {
			await TelegramLog.error(`Error follower-actions.ts solicitação não encontrada`);
			throw new Error("Solicitação não encontrada");
		}

		await prisma.follower.create({
			data: {
				followerId: request.senderId,
				followingId: request.receiverId,
			},
		});

		await prisma.followRequest.delete({
			where: { id: requestId },
		});

		updateTag("user-session");
		updateTag("follow-requests");
		updateTag("user-profile");

		return {
			success: true,
			senderId: request.senderId,
			receiverId: request.receiverId,
		};
	} catch (error: any) {
		await TelegramLog.error(`Error follower-actions.ts erro ao aceitar solicitação ${error?.message}`);
		throw new Error(error?.message);
	}
}

export async function rejectFollowRequest(requestId: string) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			await TelegramLog.error(`Error follower-actions.ts usuário não autenticado`);
			throw new Error("Usuário não autenticado");
		}

		const request = await prisma.followRequest.findFirst({
			where: { id: requestId, receiverId: session.user.id },
		});

		if (!request) {
			await TelegramLog.error(`Error follower-actions.ts solicitação não encontrada`);
			throw new Error("Solicitação não encontrada");
		}

		await prisma.followRequest.delete({
			where: { id: requestId },
		});

		updateTag("follow-requests");
		updateTag("user-profile");

		return {
			success: true,
			senderId: request.senderId,
			receiverId: request.receiverId,
		};
	} catch (error: any) {
		await TelegramLog.error(`Catch Error follower-actions.ts erro ao rejeitar solicitação ${error?.message}`);
		throw new Error(error?.message);
	}
}
