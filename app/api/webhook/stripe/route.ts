import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { expireCreditsPurchase, fulfillCreditsPurchase } from "@/lib/services/credits.service";
import { getStripe } from "@/lib/stripe";
import TelegramLog from "@/lib/telegram-logger";

export async function POST(req: NextRequest) {
	const secret = process.env.STRIPE_WEBHOOK_SECRET;
	const signature = req.headers.get("stripe-signature");
	if (!secret || !signature) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

	let event: Stripe.Event;
	try {
		// The signature covers the raw body: read it as text before any parsing.
		event = getStripe().webhooks.constructEvent(await req.text(), signature, secret);
	} catch {
		return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
	}

	try {
		switch (event.type) {
			case "checkout.session.completed":
			case "checkout.session.async_payment_succeeded": {
				const session = event.data.object;
				// A payment method with delayed confirmation arrives in `completed` still unpaid.
				if (session.payment_status !== "unpaid" && (await fulfillCreditsPurchase(session.id))) {
					await TelegramLog.info(
						`CREDITS PURCHASED (Stripe): ${session.id} US$ ${(session.amount_total ?? 0) / 100}`,
					);
				}
				break;
			}
			case "checkout.session.expired":
			case "checkout.session.async_payment_failed":
				await expireCreditsPurchase(event.data.object.id);
				break;
		}
		return NextResponse.json({ received: true });
	} catch (error: unknown) {
		await TelegramLog.error(`Stripe webhook: ❌ ${(error as Error)?.message}`);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
