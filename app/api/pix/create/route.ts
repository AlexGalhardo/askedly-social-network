import { NextResponse } from "next/server";
import { getFormatter, getTranslations } from "next-intl/server";
import { AbacatePayError, createPixCharge } from "@/lib/abacatepay";
import { registerCharge } from "@/lib/services/pix-charge.service";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";

const MIN_AMOUNT_CENTS = 200;
const MAX_AMOUNT_CENTS = 1_000_000;
const PIX_EXPIRES_IN_SECONDS = 600;

export async function POST(request: Request) {
	try {
		const user = await getSessionUser();
		if (!user)
			return NextResponse.json({ error: (await getTranslations("errors"))("unauthorized") }, { status: 401 });

		const { amount, nickname } = await request.json();

		if (!Number.isInteger(amount) || amount < MIN_AMOUNT_CENTS || amount > MAX_AMOUNT_CENTS) {
			const minimum = (await getFormatter()).number(MIN_AMOUNT_CENTS / 100, {
				style: "currency",
				currency: "BRL",
			});
			return NextResponse.json(
				{ error: (await getTranslations("payments"))("api.minimumAmount", { amount: minimum }) },
				{ status: 400 },
			);
		}

		const charge = await createPixCharge({
			amount,
			expiresIn: PIX_EXPIRES_IN_SECONDS,
			description: `Askedly: question for @${String(nickname ?? "").slice(0, 32)}`,
			metadata: { askerNickname: user.nickname },
		});
		await registerCharge(user.id, charge);

		return NextResponse.json({
			id: charge.id,
			amount: charge.amount,
			status: charge.status,
			brCode: charge.brCode,
			brCodeBase64: charge.brCodeBase64,
			expiresAt: charge.expiresAt,
		});
	} catch (error: unknown) {
		await TelegramLog.error(`Catch ERROR generating PIX to pay: ${(error as Error)?.message}`);
		const status = error instanceof AbacatePayError ? 502 : 500;
		return NextResponse.json({ error: (await getTranslations("payments"))("api.pixCreateFailed") }, { status });
	}
}
