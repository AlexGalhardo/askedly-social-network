"use server";

import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/prisma/prisma-client";
import TelegramLog from "@/lib/telegram-logger";

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

		revalidateTag("user-session");

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

		const request = await prisma.followRequest.findUnique({
			where: { id: requestId },
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

		revalidateTag("user-session");
		revalidateTag("follow-requests");
		revalidateTag("user-profile");

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

		const request = await prisma.followRequest.findUnique({
			where: { id: requestId },
		});

		if (!request) {
			await TelegramLog.error(`Error follower-actions.ts solicitação não encontrada`);
			throw new Error("Solicitação não encontrada");
		}

		await prisma.followRequest.delete({
			where: { id: requestId },
		});

		revalidateTag("follow-requests");
		revalidateTag("user-profile");

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
