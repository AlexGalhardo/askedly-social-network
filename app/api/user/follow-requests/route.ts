import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { authOptions } from "@/lib/auth";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function GET(_request: NextRequest) {
	const te = await getTranslations("errors");
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ message: te("unauthorized") }, { status: 401 });
		}

		const followRequests = await prisma.followRequest.findMany({
			where: {
				receiverId: session.user.id,
			},
			include: {
				sender: {
					select: {
						id: true,
						name: true,
						nickname: true,
						avatar_url: true,
						description: true,
					},
				},
			},
			orderBy: {
				created_at: "desc",
			},
		});

		return NextResponse.json({
			followRequests,
			count: followRequests.length,
		});
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file follow-requests.ts: ${error?.message}`);
		return NextResponse.json({ message: te("internal") }, { status: 500 });
	}
}
