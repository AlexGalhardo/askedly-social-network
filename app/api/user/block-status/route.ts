import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function GET(request: NextRequest) {
	const te = await getTranslations("errors");
	const t = await getTranslations("account.errors");
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ message: te("unauthorized") }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const targetNickname = searchParams.get("targetNickname");

		if (!targetNickname) {
			return NextResponse.json({ message: t("nicknameRequired") }, { status: 400 });
		}

		const targetUser = await prisma.user.findUnique({
			where: { nickname: targetNickname },
			select: { id: true },
		});

		if (!targetUser) {
			return NextResponse.json({ message: t("userNotFound") }, { status: 404 });
		}

		const blockExists = await prisma.userBlock.findUnique({
			where: {
				blocker_id_blocked_id: {
					blocker_id: session.user.id,
					blocked_id: targetUser.id,
				},
			},
		});

		return NextResponse.json({
			isBlocked: !!blockExists,
		});
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file user-block-status.ts: ${error?.message}`);
		return NextResponse.json({ message: te("internal") }, { status: 500 });
	}
}
