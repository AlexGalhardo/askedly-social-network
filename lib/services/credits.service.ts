import { randomBytes, randomUUID } from "node:crypto";
import { PAYMENTS_SIMULATED } from "@/lib/payment-simulation";
import { appUrl, getStripe } from "@/lib/stripe";
import { prisma } from "@/prisma/prisma-client";

export const MIN_CREDITS_PURCHASE_CENTS = 500;
export const MAX_CREDITS_PURCHASE_CENTS = 100_000;

export function isValidCreditsPurchase(amountCents: unknown): amountCents is number {
	return (
		Number.isInteger(amountCents) &&
		(amountCents as number) >= MIN_CREDITS_PURCHASE_CENTS &&
		(amountCents as number) <= MAX_CREDITS_PURCHASE_CENTS
	);
}

/** Opens a Stripe Checkout to buy credits (1 credit = 1 US dollar cent) and returns the URL. */
export async function createCreditsCheckout(userId: string, amountCents: number): Promise<string> {
	if (PAYMENTS_SIMULATED) {
		const sessionId = `sim_${randomUUID()}`;
		await prisma.stripePurchase.create({
			data: { user_id: userId, checkout_session_id: sessionId, amount_cents: amountCents },
		});
		await fulfillCreditsPurchase(sessionId);
		return appUrl("/my-account?credits=success");
	}

	const session = await getStripe().checkout.sessions.create({
		mode: "payment",
		line_items: [
			{
				quantity: 1,
				price_data: {
					currency: "usd",
					unit_amount: amountCents,
					product_data: { name: "Askedly credits" },
				},
			},
		],
		client_reference_id: userId,
		integration_identifier: `credits_${randomBytes(4).toString("hex")}`,
		success_url: appUrl("/my-account?credits=success"),
		cancel_url: appUrl("/my-account?credits=cancel"),
	});
	if (!session.url) throw new Error("Stripe Checkout session has no URL");

	await prisma.stripePurchase.create({
		data: { user_id: userId, checkout_session_id: session.id, amount_cents: amountCents },
	});
	return session.url;
}

/**
 * Credits a paid purchase. Idempotent: the filter on `status` makes retries and duplicate webhook events
 * find count 0, and the credit is applied in the same transaction. The amount is the one recorded when creating the Checkout.
 */
export async function fulfillCreditsPurchase(checkoutSessionId: string): Promise<boolean> {
	return prisma.$transaction(async (tx) => {
		const purchase = await tx.stripePurchase.findUnique({ where: { checkout_session_id: checkoutSessionId } });
		if (!purchase) return false;

		const { count } = await tx.stripePurchase.updateMany({
			where: { id: purchase.id, status: { not: "completed" } },
			data: { status: "completed" },
		});
		if (count === 0) return false;

		await tx.user.update({
			where: { id: purchase.user_id },
			data: { credits_cents: { increment: purchase.amount_cents } },
		});
		return true;
	});
}

export async function expireCreditsPurchase(checkoutSessionId: string): Promise<void> {
	await prisma.stripePurchase.updateMany({
		where: { checkout_session_id: checkoutSessionId, status: "pending" },
		data: { status: "expired" },
	});
}
