import { type CheckCharge, ensureChargePaid } from "@/lib/services/pix-charge.service";
import { prisma } from "@/prisma/prisma-client";

export type CreateQuestionErrorKey =
	| "paymentNotConfirmed"
	| "ownerNotFound"
	| "payerNotFound"
	| "paymentNotFound"
	| "paymentAlreadyUsed"
	| "dailyLimitReached"
	| "invalidAmount"
	| "insufficientCredits"
	| "cannotAskYourself";

/** `message` is a `questions.createErrors` key: whoever catches it translates. */
export class CreateQuestionError extends Error {
	declare message: CreateQuestionErrorKey;

	constructor(
		message: CreateQuestionErrorKey,
		readonly status: 400 | 404 | 409 | 429 = 400,
	) {
		super(message);
	}
}

export interface CreatePaidQuestionInput {
	/** Always the session user. */
	askerId: string;
	ownerId: string;
	pixId: string;
	questionText: string;
	isAnonymous: boolean;
	askerWantsPrivateAnswer?: boolean;
	amountIsPrivate?: boolean;
}

/**
 * Creates the question linked to a confirmed PIX payment. The recorded amount is the paid webhook's,
 * never an amount provided by the client: it defines the payout to the owner and the refund to the asker.
 */
export async function createPaidQuestion(input: CreatePaidQuestionInput, checkCharge?: CheckCharge) {
	if (!(await ensureChargePaid(input.pixId, input.askerId, checkCharge))) {
		throw new CreateQuestionError("paymentNotConfirmed", 404);
	}

	return prisma.$transaction(async (tx) => {
		const [owner, asker] = await Promise.all([
			tx.user.findUnique({ where: { id: input.ownerId }, select: { nickname: true } }),
			tx.user.findUnique({ where: { id: input.askerId }, select: { nickname: true } }),
		]);
		if (!owner) throw new CreateQuestionError("ownerNotFound", 404);
		if (!asker) throw new CreateQuestionError("payerNotFound", 404);

		const webhook = await tx.webhookAbacatePay.findUnique({
			where: { pix_id: input.pixId },
			include: { question: true },
		});
		if (!webhook) throw new CreateQuestionError("paymentNotFound", 404);
		if (webhook.question) throw new CreateQuestionError("paymentAlreadyUsed", 409);

		const limitField = input.isAnonymous
			? "anonymous_questions_remaining_today"
			: "public_questions_remaining_today";
		const { count } = await tx.user.updateMany({
			where: { id: input.askerId, [limitField]: { gt: 0 } },
			data: { [limitField]: { decrement: 1 } },
		});
		if (count === 0) throw new CreateQuestionError("dailyLimitReached", 429);

		return tx.question.create({
			data: {
				question_text: input.questionText.trim(),
				amount_paid: webhook.amount,
				asker_want_answer_to_be_private: input.askerWantsPrivateAnswer ?? false,
				asker_sent_anonymous_question: input.isAnonymous,
				amount_paid_is_private: input.amountIsPrivate ?? false,
				owner_user_nickname: owner.nickname,
				asked_by_user_nickname: asker.nickname,
				liked_by_users: "[]",
				desliked_by_users: "[]",
				webhook_id: webhook.id,
			},
			include: {
				owner: { select: { id: true, name: true, nickname: true, avatar_url: true } },
				asked_by: { select: { id: true, name: true, nickname: true, avatar_url: true } },
				webhook: { select: { id: true, status: true, amount: true, created_at: true } },
			},
		});
	});
}

export const MIN_CREDIT_QUESTION_CENTS = 200;
export const MAX_CREDIT_QUESTION_CENTS = 100_000;

export interface CreateCreditQuestionInput extends Omit<CreatePaidQuestionInput, "pixId"> {
	amountCents: number;
}

/**
 * Creates the question paid with credits (US dollar). The debit is conditional on the balance and runs in the same transaction as the
 * question: two simultaneous requests do not spend the same credit, and a failure rolls back the debit.
 */
export async function createCreditQuestion(input: CreateCreditQuestionInput) {
	if (
		!Number.isInteger(input.amountCents) ||
		input.amountCents < MIN_CREDIT_QUESTION_CENTS ||
		input.amountCents > MAX_CREDIT_QUESTION_CENTS
	) {
		throw new CreateQuestionError("invalidAmount", 400);
	}

	// Without this, credits become a payout to the Stripe account of whoever bought them.
	if (input.askerId === input.ownerId) throw new CreateQuestionError("cannotAskYourself", 400);

	return prisma.$transaction(async (tx) => {
		const [owner, asker] = await Promise.all([
			tx.user.findUnique({ where: { id: input.ownerId }, select: { nickname: true } }),
			tx.user.findUnique({ where: { id: input.askerId }, select: { nickname: true } }),
		]);
		if (!owner) throw new CreateQuestionError("ownerNotFound", 404);
		if (!asker) throw new CreateQuestionError("payerNotFound", 404);

		const limitField = input.isAnonymous
			? "anonymous_questions_remaining_today"
			: "public_questions_remaining_today";
		const limit = await tx.user.updateMany({
			where: { id: input.askerId, [limitField]: { gt: 0 } },
			data: { [limitField]: { decrement: 1 } },
		});
		if (limit.count === 0) throw new CreateQuestionError("dailyLimitReached", 429);

		const debit = await tx.user.updateMany({
			where: { id: input.askerId, credits_cents: { gte: input.amountCents } },
			data: { credits_cents: { decrement: input.amountCents } },
		});
		if (debit.count === 0) throw new CreateQuestionError("insufficientCredits", 400);

		return tx.question.create({
			data: {
				question_text: input.questionText.trim(),
				amount_paid: input.amountCents,
				currency: "USD",
				asker_want_answer_to_be_private: input.askerWantsPrivateAnswer ?? false,
				asker_sent_anonymous_question: input.isAnonymous,
				amount_paid_is_private: input.amountIsPrivate ?? false,
				owner_user_nickname: owner.nickname,
				asked_by_user_nickname: asker.nickname,
				liked_by_users: "[]",
				desliked_by_users: "[]",
			},
			include: {
				owner: { select: { id: true, name: true, nickname: true, avatar_url: true } },
				asked_by: { select: { id: true, name: true, nickname: true, avatar_url: true } },
			},
		});
	});
}
