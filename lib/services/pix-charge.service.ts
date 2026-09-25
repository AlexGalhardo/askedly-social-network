import { checkPixCharge, type PixCharge } from "@/lib/abacatepay";
import { prisma } from "@/prisma/prisma-client";

export type CheckCharge = typeof checkPixCharge;

/** Guarda a cobrança recém-criada: o valor é o que a AbacatePay confirmou, e fica ligada a quem vai pagar. */
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

/** Idempotente: retentativas do webhook (mesmo evento) e o polling não reprocessam uma cobrança já paga. */
export async function markChargePaid(pixId: string, completeEvent: string, eventStatus = "transparent.completed") {
	const { count } = await prisma.webhookAbacatePay.updateMany({
		where: { pix_id: pixId, status: { not: "PAID" } },
		data: { status: "PAID", event_status: eventStatus, complete_event: completeEvent },
	});
	return count === 1;
}

/**
 * Garante que a cobrança do usuário está paga. Se o webhook ainda não chegou, confirma direto na AbacatePay.
 * Retorna false para cobrança inexistente, de outro usuário ou não paga.
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
