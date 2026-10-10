import { PAYMENTS_SIMULATED } from "@/lib/payment-simulation";
import { calculatePayout } from "@/lib/services/withdraw.service";
import { appUrl, getStripe } from "@/lib/stripe";
import TelegramLog from "@/lib/telegram-logger";
import { QUESTION_ANSWER_WINDOW_HOURS } from "@/lib/utils/question-utils";
import { prisma } from "@/prisma/prisma-client";

export type PayoutStatus = "none" | "pending" | "active";

async function canReceiveTransfers(accountId: string): Promise<boolean> {
	if (PAYMENTS_SIMULATED) return true;
	const account = await getStripe().v2.core.accounts.retrieve(accountId, { include: ["configuration.recipient"] });
	return account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === "active";
}

export async function getPayoutStatus(userId: string): Promise<PayoutStatus> {
	const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripe_account_id: true } });
	if (!user?.stripe_account_id) return "none";
	return (await canReceiveTransfers(user.stripe_account_id)) ? "active" : "pending";
}

/**
 * Cria (uma vez) a conta conectada do usuário e devolve o link de onboarding hospedado pela Stripe.
 * Conta de marketplace: só recebe transferências, a plataforma cobra as taxas e responde por saldo negativo.
 */
export async function startPayoutOnboarding(userId: string, country: string): Promise<string> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { email: true, name: true, stripe_account_id: true },
	});
	if (!user) throw new Error("User not found");

	if (PAYMENTS_SIMULATED) {
		await prisma.user.updateMany({
			where: { id: userId, stripe_account_id: null },
			data: { stripe_account_id: `acct_sim_${userId}` },
		});
		return appUrl("/my-account?payouts=return");
	}

	const stripe = getStripe();
	let accountId = user.stripe_account_id;
	if (!accountId) {
		const account = await stripe.v2.core.accounts.create({
			contact_email: user.email,
			display_name: user.name,
			dashboard: "express",
			identity: { country: country.toLowerCase() },
			configuration: {
				recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } },
			},
			defaults: { responsibilities: { fees_collector: "application", losses_collector: "application" } },
			metadata: { user_id: userId },
		});
		accountId = account.id;
		// O filtro em null evita que dois cliques simultâneos gravem contas diferentes.
		const { count } = await prisma.user.updateMany({
			where: { id: userId, stripe_account_id: null },
			data: { stripe_account_id: accountId },
		});
		if (count === 0) throw new Error("Payout account already exists");
	}

	const link = await stripe.v2.core.accountLinks.create({
		account: accountId,
		use_case: {
			type: "account_onboarding",
			account_onboarding: {
				configurations: ["recipient"],
				refresh_url: appUrl("/my-account?payouts=refresh"),
				return_url: appUrl("/my-account?payouts=return"),
			},
		},
	});
	return link.url;
}

export interface TransferInput {
	accountId: string;
	amountCents: number;
	questionId: string;
}

/** Devolve o id da transferência, ou null se a conta ainda não pode receber. */
export type SendTransfer = (input: TransferInput) => Promise<string | null>;

const sendStripeTransfer: SendTransfer = async ({ accountId, amountCents, questionId }) => {
	if (!(await canReceiveTransfers(accountId))) return null;
	if (PAYMENTS_SIMULATED) return `tr_sim_${questionId}`;

	const stripe = getStripe();
	const transferGroup = `question_${questionId}`;
	// Uma tentativa anterior pode ter transferido e caído antes de gravar no banco: nunca transferir duas vezes.
	const existing = await stripe.transfers.list({ transfer_group: transferGroup, limit: 1 });
	if (existing.data[0]) return existing.data[0].id;

	const transfer = await stripe.transfers.create(
		{ amount: amountCents, currency: "usd", destination: accountId, transfer_group: transferGroup },
		{ idempotencyKey: `question-payout-${questionId}` },
	);
	return transfer.id;
};

/**
 * Liquida uma pergunta paga com créditos que já saiu da fila de resposta:
 * respondida = transfere ao dono o valor já sem a taxa da plataforma; recusada, expirada ou denunciada = devolve
 * os créditos a quem perguntou. Pode ser chamada várias vezes: `amount_already_withdraw` marca a liquidação.
 * Sem conta Stripe apta (ou sem saldo disponível na plataforma) nada muda, e o cron tenta de novo.
 */
export async function settleCreditQuestion(
	questionId: string,
	sendTransfer: SendTransfer = sendStripeTransfer,
): Promise<void> {
	const question = await prisma.question.findFirst({
		where: { id: questionId, currency: "USD", amount_already_withdraw: false, question_is_awaiting_answer: false },
		select: {
			amount_paid: true,
			question_answered: true,
			asked_by_user_nickname: true,
			owner: { select: { stripe_account_id: true } },
		},
	});
	if (!question) return;

	if (!question.question_answered) {
		await prisma.$transaction(async (tx) => {
			const { count } = await tx.question.updateMany({
				where: { id: questionId, amount_already_withdraw: false },
				data: { amount_already_withdraw: true },
			});
			if (count === 0) return;
			await tx.user.update({
				where: { nickname: question.asked_by_user_nickname },
				data: { credits_cents: { increment: question.amount_paid } },
			});
		});
		return;
	}

	const accountId = question.owner.stripe_account_id;
	if (!accountId) return;

	try {
		const transferId = await sendTransfer({
			accountId,
			amountCents: calculatePayout(question.amount_paid),
			questionId,
		});
		if (!transferId) return;
		await prisma.question.update({
			where: { id: questionId },
			data: { amount_already_withdraw: true, stripe_transfer_id: transferId },
		});
	} catch (error: unknown) {
		await TelegramLog.error(`Stripe transfer failed for question ${questionId}: ${(error as Error)?.message}`);
	}
}

/** Cron: expira perguntas em créditos vencidas e tenta de novo toda liquidação pendente. */
export async function settlePendingCreditQuestions(sendTransfer?: SendTransfer): Promise<number> {
	await prisma.question.updateMany({
		where: {
			currency: "USD",
			question_is_awaiting_answer: true,
			question_answered: false,
			created_at: { lte: new Date(Date.now() - QUESTION_ANSWER_WINDOW_HOURS * 60 * 60 * 1000) },
		},
		data: {
			question_is_awaiting_answer: false,
			question_answer_was_expired: true,
			question_answer_expired_at: new Date(),
		},
	});

	const pending = await prisma.question.findMany({
		where: { currency: "USD", amount_already_withdraw: false, question_is_awaiting_answer: false },
		select: { id: true },
	});
	for (const { id } of pending) await settleCreditQuestion(id, sendTransfer);
	return pending.length;
}
