"use server";

import { updateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function removeFollower(followerId: string) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			throw new Error((await getTranslations("errors"))("unauthorized"));
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
			await TelegramLog.error(`Error follower-actions.ts user not authenticated`);
			throw new Error((await getTranslations("errors"))("unauthorized"));
		}

		const request = await prisma.followRequest.findFirst({
			where: { id: requestId, receiverId: session.user.id },
		});

		if (!request) {
			await TelegramLog.error(`Error follower-actions.ts request not found`);
			throw new Error((await getTranslations("account.errors"))("followRequestNotFound"));
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
		await TelegramLog.error(`Error follower-actions.ts error accepting request ${error?.message}`);
		throw new Error(error?.message);
	}
}

export async function rejectFollowRequest(requestId: string) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			await TelegramLog.error(`Error follower-actions.ts user not authenticated`);
			throw new Error((await getTranslations("errors"))("unauthorized"));
		}

		const request = await prisma.followRequest.findFirst({
			where: { id: requestId, receiverId: session.user.id },
		});

		if (!request) {
			await TelegramLog.error(`Error follower-actions.ts request not found`);
			throw new Error((await getTranslations("account.errors"))("followRequestNotFound"));
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
		await TelegramLog.error(`Catch Error follower-actions.ts error rejecting request ${error?.message}`);
		throw new Error(error?.message);
	}
}
