import { NextResponse } from "next/server";
import { getPayoutStatus, startPayoutOnboarding } from "@/lib/services/stripe-connect.service";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

/** Saldo de créditos e situação da conta de recebimento do usuário da sessão. */
export async function GET() {
	try {
		const user = await getSessionUser();
		if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

		const [row, payoutStatus] = await Promise.all([
			prisma.user.findUnique({ where: { id: user.id }, select: { credits_cents: true } }),
			getPayoutStatus(user.id),
		]);
		return NextResponse.json({ credits: row?.credits_cents ?? 0, payoutStatus });
	} catch (error: unknown) {
		await TelegramLog.error(`Stripe connect status: ❌ ${(error as Error)?.message}`);
		return NextResponse.json({ error: "Não foi possível consultar a Stripe" }, { status: 502 });
	}
}

export async function POST(request: Request) {
	try {
		const user = await getSessionUser();
		if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

		const { country } = await request.json();
		if (typeof country !== "string" || !/^[A-Za-z]{2}$/.test(country)) {
			return NextResponse.json({ error: "País inválido" }, { status: 400 });
		}

		return NextResponse.json({ url: await startPayoutOnboarding(user.id, country) });
	} catch (error: unknown) {
		await TelegramLog.error(`Stripe connect onboarding: ❌ ${(error as Error)?.message}`);
		return NextResponse.json({ error: "Não foi possível abrir o cadastro na Stripe" }, { status: 502 });
	}
}
