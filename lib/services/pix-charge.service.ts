import { checkPixCharge, type PixCharge } from "@/lib/abacatepay";
import { prisma } from "@/prisma/prisma-client";

export type CheckCharge = typeof checkPixCharge;

/** Stores the newly created charge: the amount is what AbacatePay confirmed, and it stays linked to whoever is going to pay. */
export async function registerCharge(userId: string, charge: PixCharge): Promise<void> {
	await prisma.webhookAbacatePay.create({
		data: {
			pix_id: charge.id,
			status: "PENDING",
			amount: charge.amount,
			fee: charge.platformFee,
			method: "PIX",
			kind: "transparent",
			event_status: "created",
			dev_mode: charge.devMode,
			complete_event: JSON.stringify(charge),
			userId,
		},
	});
}

/** Idempotent: webhook retries (same event) and polling do not reprocess an already paid charge. */
export async function markChargePaid(pixId: string, completeEvent: string, eventStatus = "transparent.completed") {
	const { count } = await prisma.webhookAbacatePay.updateMany({
		where: { pix_id: pixId, status: { not: "PAID" } },
		data: { status: "PAID", event_status: eventStatus, complete_event: completeEvent },
	});
	return count === 1;
}

/**
 * Ensures the user's charge is paid. If the webhook has not arrived yet, confirms directly with AbacatePay.
 * Returns false for a charge that does not exist, belongs to another user or is not paid.
 */
export async function ensureChargePaid(pixId: string, userId: string, check: CheckCharge = checkPixCharge) {
	const row = await prisma.webhookAbacatePay.findUnique({
		where: { pix_id: pixId },
		select: { status: true, userId: true },
	});
	if (!row || row.userId !== userId) return false;
	if (row.status === "PAID") return true;

	const { status } = await check(pixId);
	if (status !== "PAID") return false;

	await markChargePaid(pixId, JSON.stringify({ source: "check", status }), "check.paid");
	return true;
}
