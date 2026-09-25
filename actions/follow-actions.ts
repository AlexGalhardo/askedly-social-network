"use server";

import { updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function unfollowUser(followingId: string) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			await TelegramLog.error(`Error follow-actions.ts usuário não autenticado`);
			throw new Error("Usuário não autenticado");
		}

		await prisma.follower.deleteMany({
			where: {
				followerId: session.user.id,
				followingId: followingId,
			},
		});

		updateTag("user-session");

		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file follow-actions.ts unfollow user: ${error?.message}`);
		throw new Error(error?.message);
	}
}
