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

/** Abre um Checkout da Stripe para comprar créditos (1 crédito = 1 centavo de dólar) e devolve a URL. */
export async function createCreditsCheckout(userId: string, amountCents: number): Promise<string> {
	if (PAYMENTS_SIMULATED) {
		const sessionId = `sim_${randomUUID()}`;
		await prisma.stripePurchase.create({
			data: { user_id: userId, checkout_session_id: sessionId, amount_cents: amountCents },
		});
		await fulfillCreditsPurchase(sessionId);
		return appUrl("/minha-conta?credits=success");
	}

	const session = await getStripe().checkout.sessions.create({
		mode: "payment",
		line_items: [
			{
				quantity: 1,
				price_data: {
					currency: "usd",
					unit_amount: amountCents,
					product_data: { name: "Askedly Social Network credits" },
				},
			},
		],
		client_reference_id: userId,
		integration_identifier: `credits_${randomBytes(4).toString("hex")}`,
		success_url: appUrl("/minha-conta?credits=success"),
		cancel_url: appUrl("/minha-conta?credits=cancel"),
	});
	if (!session.url) throw new Error("Stripe Checkout session has no URL");

	await prisma.stripePurchase.create({
		data: { user_id: userId, checkout_session_id: session.id, amount_cents: amountCents },
	});
	return session.url;
}

/**
 * Credita uma compra paga. Idempotente: o filtro em `status` faz retentativas e eventos duplicados do webhook
 * encontrarem count 0, e o crédito sai na mesma transação. O valor é o gravado ao criar o Checkout.
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
