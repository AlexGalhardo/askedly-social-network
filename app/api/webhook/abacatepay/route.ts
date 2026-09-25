import { NextRequest, NextResponse } from "next/server";
import { ABACATEPAY_WEBHOOK_SECRET, verifyWebhookSignature } from "@/lib/abacatepay";
import { markChargePaid } from "@/lib/services/pix-charge.service";
import TelegramLog from "@/lib/telegram-logger";
import { formatCurrency } from "@/lib/utils";

interface TransparentCompletedEvent {
	id: string;
	event: string;
	devMode: boolean;
	data?: { transparent?: { id?: string; paidAmount?: number; platformFee?: number } };
}

export async function POST(req: NextRequest) {
	const webhookSecret = new URL(req.url).searchParams.get("webhookSecret");
	if (!ABACATEPAY_WEBHOOK_SECRET || webhookSecret !== ABACATEPAY_WEBHOOK_SECRET) {
		return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
	}

	// A assinatura cobre o corpo cru: ler como texto antes de qualquer parse.
	const rawBody = await req.text();
	if (!verifyWebhookSignature(rawBody, req.headers.get("x-webhook-signature"))) {
		return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
	}

	try {
		const event = JSON.parse(rawBody) as TransparentCompletedEvent;
		const charge = event.data?.transparent;

		// Outros eventos são aceitos (2xx) para a AbacatePay não reenviar, mas não mudam nada aqui.
		if (event.event !== "transparent.completed" || !charge?.id) return NextResponse.json({ received: true });

		if (await markChargePaid(charge.id, rawBody)) {
			await TelegramLog.info(`PIX PAGO (webhook AbacatePay):

		PIX_ID: ${charge.id}
		PAGOU: ${formatCurrency(charge.paidAmount ?? 0)}
		TAXA: ${formatCurrency(charge.platformFee ?? 0)}
		DEV_MODE: ${event.devMode}
		`);
		}

		return NextResponse.json({ received: true });
	} catch (error: unknown) {
		await TelegramLog.error(`Catch Error webhook-abacatepay.ts: ${(error as Error)?.message}`);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
