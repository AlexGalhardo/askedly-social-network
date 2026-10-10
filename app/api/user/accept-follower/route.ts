import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function POST(request: NextRequest) {
	const te = await getTranslations("errors");
	const t = await getTranslations("account");
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ message: te("unauthorized") }, { status: 401 });
		}

		const { requestId } = await request.json();

		if (!requestId) {
			return NextResponse.json({ message: t("errors.requestIdRequired") }, { status: 400 });
		}

		const followRequest = await prisma.followRequest.findFirst({
			where: {
				id: requestId,
				receiverId: session.user.id,
			},
		});

		if (!followRequest) {
			return NextResponse.json({ message: t("errors.followRequestNotFound") }, { status: 404 });
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

			return NextResponse.json({ message: t("errors.alreadyFollower") }, { status: 400 });
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
			message: t("api.followerAccepted"),
		});
	} catch (error: any) {
		await TelegramLog.error(`Catch Error accept-follower.ts: ${error?.message}`);
		return NextResponse.json({ message: te("internal") }, { status: 500 });
	}
}
