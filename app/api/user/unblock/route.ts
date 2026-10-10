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

		const body = await request.json();
		const { targetUserNickname } = body;

		if (!targetUserNickname) {
			return NextResponse.json({ message: t("errors.nicknameRequired") }, { status: 400 });
		}

		const targetUser = await prisma.user.findUnique({
			where: { nickname: targetUserNickname },
			select: { id: true, nickname: true },
		});

		if (!targetUser) {
			return NextResponse.json({ message: t("errors.userNotFound") }, { status: 404 });
		}

		const existingBlock = await prisma.userBlock.findUnique({
			where: {
				blocker_id_blocked_id: {
					blocker_id: session.user.id,
					blocked_id: targetUser.id,
				},
			},
		});

		if (!existingBlock) {
			return NextResponse.json({ message: t("errors.notBlocked") }, { status: 400 });
		}

		await prisma.userBlock.delete({
			where: {
				blocker_id_blocked_id: {
					blocker_id: session.user.id,
					blocked_id: targetUser.id,
				},
			},
		});

		return NextResponse.json({ message: t("api.userUnblocked") }, { status: 200 });
	} catch (error: any) {
		await TelegramLog.error(`Catch error on /api/user/unblock: ${error}`);
		return NextResponse.json({ message: te("internal") }, { status: 500 });
	}
}
