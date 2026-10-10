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

		const { followerId } = await request.json();

		if (!followerId) {
			return NextResponse.json({ message: t("errors.followerIdRequired") }, { status: 400 });
		}

		const followerRelation = await prisma.follower.findMany({
			where: {
				followerId: followerId,
				followingId: session.user.id,
			},
		});

		if (!followerRelation) {
			return NextResponse.json({ message: t("errors.followerRelationNotFound") }, { status: 404 });
		}

		await prisma.follower.delete({
			where: {
				id: followerRelation[0]?.id,
			},
		});

		return NextResponse.json({
			message: t("api.followerRemoved"),
		});
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file remove-follower.ts: ${error?.message}`);
		return NextResponse.json({ message: te("internal") }, { status: 500 });
	}
}
