import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { checkPixCharge } from "@/lib/abacatepay";
import { markChargePaid } from "@/lib/services/pix-charge.service";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function GET(request: Request) {
	try {
		const user = await getSessionUser();
		if (!user)
			return NextResponse.json({ error: (await getTranslations("errors"))("unauthorized") }, { status: 401 });

		const pixId = new URL(request.url).searchParams.get("id");
		if (!pixId)
			return NextResponse.json(
				{ error: (await getTranslations("payments"))("api.missingPaymentId") },
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

		const { status, expiresAt } = await checkPixCharge(pixId);
		if (status === "PAID") await markChargePaid(pixId, JSON.stringify({ source: "check", status }), "check.paid");

		return NextResponse.json({ status, expiresAt });
	} catch (error: unknown) {
		await TelegramLog.error(`Catch ERROR checking PIX status: ${(error as Error)?.message}`);
		return NextResponse.json({ error: (await getTranslations("errors"))("internal") }, { status: 500 });
	}
}
