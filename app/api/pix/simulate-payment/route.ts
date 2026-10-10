import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { simulatePixPayment } from "@/lib/abacatepay";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function POST(request: Request) {
	// Simulating a payment only exists in test mode (sandbox key); in production it would mark a PIX as paid with no money.
	// VERCEL_ENV is set by Vercel itself: even with TEST_MODE turned on by mistake, production never simulates.
	if (process.env.NEXT_PUBLIC_TEST_MODE !== "true" || process.env.VERCEL_ENV === "production") {
		return NextResponse.json({ error: (await getTranslations("errors"))("notFound") }, { status: 404 });
	}

	try {
		const user = await getSessionUser();
		if (!user)
			return NextResponse.json({ error: (await getTranslations("errors"))("unauthorized") }, { status: 401 });

		const { pixId } = await request.json();
		if (typeof pixId !== "string")
			return NextResponse.json(
				{ error: (await getTranslations("payments"))("api.missingPixId") },
				{ status: 400 },
			);

		const charge = await prisma.webhookAbacatePay.findUnique({
			where: { pix_id: pixId },
			select: { userId: true },
		});
		if (charge?.userId !== user.id)
			return NextResponse.json(
				{ error: (await getTranslations("payments"))("api.paymentNotFound") },
				{ status: 404 },
			);

		return NextResponse.json(await simulatePixPayment(pixId));
	} catch (error: unknown) {
		await TelegramLog.error(`Catch ERROR simulating PIX payment: ${(error as Error)?.message}`);
		return NextResponse.json({ error: (await getTranslations("errors"))("internal") }, { status: 500 });
	}
}
