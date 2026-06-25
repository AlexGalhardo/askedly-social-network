"use server";

import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/prisma/prisma-client";
import TelegramLog from "@/lib/telegram-logger";

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

		revalidateTag("user-session");

		return { success: true };
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file follow-actions.ts unfollow user: ${error?.message}`);
		throw new Error(error?.message);
	}
}
