import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { publicErrorMessage } from "@/lib/errors";
import TelegramLog from "@/lib/telegram-logger";
import type { Messages } from "@/messages/en";
import { prisma } from "@/prisma/prisma-client";

const createPersonalInfoSchema = (t: (key: keyof Messages["account"]["errors"]) => string) =>
	z.object({
		name: z.string().min(4, t("nameMin")).max(24, t("nameMax")),
		website: z
			.string()
			.optional()
			.refine((val) => !val || val.startsWith("https://"), {
				message: t("websiteHttps"),
			}),
		description: z
			.string()
			.optional()
			.refine((val) => !val || (val.length >= 32 && val.length <= 256), {
				message: t("descriptionLength"),
			}),
		userId: z.string().optional(), // Adicionar userId como opcional
	});

export async function POST(req: NextRequest) {
	const te = await getTranslations("errors");
	const t = await getTranslations("account");
	try {
		const session = await getServerSession(authOptions);

		console.log("session, session.user.id ->> ", session, session?.user?.id);

		if (!session?.user?.id) {
			return NextResponse.json({ error: te("unauthorized") }, { status: 401 });
		}

		const body = await req.json();

		const parsed = createPersonalInfoSchema((key) => t(`errors.${key}`)).safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{
					errors: parsed.error.issues.map((err) => ({
						path: err.path.join("."),
						message: err.message,
					})),
				},
				{ status: 400 },
			);
		}

		const { name, website, description, userId } = parsed.data;

		const targetUserId = userId || session.user.id;

		if (targetUserId !== session.user.id) {
			return NextResponse.json({ error: te("forbidden") }, { status: 403 });
		}

		const existingUser = await prisma.user.findUnique({
			where: { id: targetUserId },
		});

		if (!existingUser) {
			return NextResponse.json({ error: t("errors.userNotFound") }, { status: 404 });
		}

		const updatedUser = await prisma.user.update({
			where: {
				id: targetUserId,
			},
			data: {
				name: name.trim(),
				website: website ?? null,
				description: description ?? null,
				updated_at: new Date(),
			},
		});

		return NextResponse.json(
			{
				message: t("api.profileUpdated"),
				user: {
					id: updatedUser.id,
					name: updatedUser.name,
					website: updatedUser.website,
					description: updatedUser.description,
				},
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Catch error file update-personal-info.ts: ${error?.message}`);
		return NextResponse.json({ error: publicErrorMessage(error, te("internal")) }, { status: 500 });
	}
}
