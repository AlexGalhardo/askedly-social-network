import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { publicErrorMessage } from "@/lib/errors";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function POST(req: NextRequest) {
	const te = await getTranslations("errors");
	const t = await getTranslations("account");
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ error: te("unauthorized") }, { status: 401 });
		}

		const body = await req.json();
		const parseResult = z.object({ userId: z.string().uuid().min(1, t("errors.userIdRequired")) }).safeParse(body);

		if (!parseResult.success) {
			return NextResponse.json(
				{
					errors: parseResult.error.issues.map((err) => ({
						path: err.path.join("."),
						message: err.message,
					})),
				},
				{ status: 400 },
			);
		}

		const { userId } = parseResult.data;

		if (userId !== session.user.id) {
			return NextResponse.json({ error: t("errors.userIdMismatch") }, { status: 403 });
		}

		await prisma.user.update({
			where: { id: userId },
			data: {
				deleted_at: new Date(),
			},
		});

		return NextResponse.json({
			success: true,
			message: t("api.accountMarkedForDeletion"),
		});
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file user-actions.ts delete account: ${error?.message}`);
		return NextResponse.json({ error: publicErrorMessage(error, te("internal")) }, { status: 500 });
	}
}
