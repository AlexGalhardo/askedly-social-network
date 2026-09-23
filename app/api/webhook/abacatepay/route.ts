import { NextRequest, NextResponse } from "next/server";
import TelegramLog from "@/lib/telegram-logger";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/prisma/prisma-client";

export async function POST(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const webhookSecret = searchParams.get("webhookSecret");

	if (webhookSecret !== process.env.NEXT_PUBLIC_ABACATEPAY_WEBHOOK_SECRET)
		return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });

	try {
		const event = await req.json();

		await prisma.webhookAbacatePay.create({
			data: {
				pix_id: event.data.pixQrCode.id,
				status: event.data.pixQrCode.status,
				amount: event.data.payment.amount,
				fee: event.data.payment.fee,
				method: event.data.payment.method,
				kind: event.data.pixQrCode.kind,
				event_status: event.event,
				dev_mode: event.devMode,
				complete_event: JSON.stringify(event),
			},
		});

		TelegramLog.info(`RECEBIDO WEBHOOK DE PIX PAGO DA ABACATEPAY:

		PIX_ID: ${event.data.pixQrCode.id}
		PAGOU: ${formatCurrency(event.data.payment.amount)}
		TAXA: ${formatCurrency(event.data.payment.fee)}
		DEV_MODE: ${event.devMode}
		`);

		return NextResponse.json({ received: true });
	} catch (error: any) {
		await TelegramLog.error(`Catch Error webhook-abacatepay.ts: ${error?.message}`);
		return NextResponse.json({ error: "Invalid JSON body or internal error" }, { status: 400 });
	}
}
