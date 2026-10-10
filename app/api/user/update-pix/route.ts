import { cnpj, cpf } from "cpf-cnpj-validator";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import TelegramLog from "@/lib/telegram-logger";
import type { Messages } from "@/messages/en";
import { prisma } from "@/prisma/prisma-client";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[1-9]\d{10,14}$/;
const randomKeyRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createPixSchema = (t: (key: keyof Messages["account"]["errors"]) => string) =>
	z.object({
		pixKey: z
			.string()
			.max(77, t("pixKeyTooLong"))
			.refine((key) => key.trim().length > 0, {
				message: t("pixKeyEmpty"),
			})
			.refine(
				(key) => {
					const cleanKey = key.trim();
					const digitsOnly = cleanKey.replace(/\D/g, "");
					const isEmail = emailRegex.test(cleanKey);
					const isPhone = phoneRegex.test(digitsOnly);
					const isValidCPF = cpf.isValid(digitsOnly);
					const isValidCNPJ = cnpj.isValid(digitsOnly);
					const isRandomKey = randomKeyRegex.test(cleanKey);

					return isEmail || isPhone || isValidCPF || isValidCNPJ || isRandomKey;
				},
				{
					message: t("pixKeyInvalidFormat"),
				},
			),
	});

export async function POST(req: NextRequest) {
	const te = await getTranslations("errors");
	const t = await getTranslations("account");
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ error: te("unauthorized") }, { status: 401 });
		}

		const body = await req.json();

		const result = createPixSchema((key) => t(`errors.${key}`)).safeParse(body);

		if (!result.success) {
			const formattedErrors = result.error.issues.map((issue) => ({
				validation: "pixKey",
				code: issue.code,
				message: issue.message,
				path: issue.path,
			}));

			return NextResponse.json({ errors: formattedErrors }, { status: 400 });
		}

		const { pixKey } = result.data;

		const updatedUser = await prisma.user.update({
			where: {
				id: session.user.id,
			},
			data: {
				pix_key: pixKey.trim(),
				updated_at: new Date(),
			},
		});

		return NextResponse.json(
			{
				message: t("api.pixUpdated"),
				user: {
					id: updatedUser.id,
					pix_key: updatedUser.pix_key,
				},
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Error updating pix key: ${error?.message}`);
		return NextResponse.json({ error: t("errors.pixUpdateFailed") }, { status: 500 });
	}
}
