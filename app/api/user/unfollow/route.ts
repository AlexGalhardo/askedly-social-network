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

		const { followingId } = await request.json();

		if (!followingId) {
			return NextResponse.json({ message: t("errors.followingIdRequired") }, { status: 400 });
		}

		const followerRelation = await prisma.follower.findMany({
			where: {
				followerId: session.user.id,
				followingId: followingId,
			},
		});

		if (!followerRelation || followerRelation.length === 0) {
			return NextResponse.json({ message: t("errors.followerRelationNotFound") }, { status: 404 });
		}

		await prisma.follower.delete({
			where: {
				id: followerRelation[0].id,
			},
		});

		return NextResponse.json({
			message: t("api.unfollowed"),
		});
	} catch (error: any) {
		await TelegramLog.error(`Catch Error unfollow.ts: ${error?.message}`);
		return NextResponse.json({ message: te("internal") }, { status: 500 });
	}
}
