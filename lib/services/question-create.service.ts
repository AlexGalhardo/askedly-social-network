import { type CheckCharge, ensureChargePaid } from "@/lib/services/pix-charge.service";
import { prisma } from "@/prisma/prisma-client";

export class CreateQuestionError extends Error {
	constructor(
		message: string,
		readonly status: 400 | 404 | 409 | 429 = 400,
	) {
		super(message);
	}
}

export interface CreatePaidQuestionInput {
	/** Sempre o usuário da sessão. */
	askerId: string;
	ownerId: string;
	pixId: string;
	questionText: string;
	isAnonymous: boolean;
	askerWantsPrivateAnswer?: boolean;
	amountIsPrivate?: boolean;
}

/**
 * Cria a pergunta ligada a um pagamento PIX confirmado. O valor registrado é o do webhook pago,
 * nunca um valor informado pelo client: ele define o repasse ao dono e o reembolso a quem perguntou.
 */
export async function createPaidQuestion(input: CreatePaidQuestionInput, checkCharge?: CheckCharge) {
	if (!(await ensureChargePaid(input.pixId, input.askerId, checkCharge))) {
		throw new CreateQuestionError("Pagamento não encontrado ou ainda não confirmado", 404);
	}

	return prisma.$transaction(async (tx) => {
		const [owner, asker] = await Promise.all([
			tx.user.findUnique({ where: { id: input.ownerId }, select: { nickname: true } }),
			tx.user.findUnique({ where: { id: input.askerId }, select: { nickname: true } }),
		]);
		if (!owner) throw new CreateQuestionError("Usuário proprietário não encontrado", 404);
		if (!asker) throw new CreateQuestionError("Usuário que fez o pagamento não encontrado", 404);

		const webhook = await tx.webhookAbacatePay.findUnique({
			where: { pix_id: input.pixId },
			include: { question: true },
		});
		if (!webhook) throw new CreateQuestionError("Pagamento não encontrado", 404);
		if (webhook.question) throw new CreateQuestionError("Já existe uma pergunta associada a este pagamento", 409);

		const limitField = input.isAnonymous
			? "anonymous_questions_remaining_today"
			: "public_questions_remaining_today";
		const { count } = await tx.user.updateMany({
			where: { id: input.askerId, [limitField]: { gt: 0 } },
			data: { [limitField]: { decrement: 1 } },
		});
		if (count === 0) throw new CreateQuestionError("Limite diário de perguntas atingido", 429);

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
 * Cria a pergunta paga com créditos (dólar). O débito é condicional ao saldo e roda na mesma transação da
 * pergunta: duas requisições simultâneas não gastam o mesmo crédito, e uma falha desfaz o débito.
 */
export async function createCreditQuestion(input: CreateCreditQuestionInput) {
	if (
		!Number.isInteger(input.amountCents) ||
		input.amountCents < MIN_CREDIT_QUESTION_CENTS ||
		input.amountCents > MAX_CREDIT_QUESTION_CENTS
	) {
		throw new CreateQuestionError("Valor inválido", 400);
	}

	return prisma.$transaction(async (tx) => {
		const [owner, asker] = await Promise.all([
			tx.user.findUnique({ where: { id: input.ownerId }, select: { nickname: true } }),
			tx.user.findUnique({ where: { id: input.askerId }, select: { nickname: true } }),
		]);
		if (!owner) throw new CreateQuestionError("Usuário proprietário não encontrado", 404);
		if (!asker) throw new CreateQuestionError("Usuário que fez o pagamento não encontrado", 404);

		const limitField = input.isAnonymous
			? "anonymous_questions_remaining_today"
			: "public_questions_remaining_today";
		const limit = await tx.user.updateMany({
			where: { id: input.askerId, [limitField]: { gt: 0 } },
			data: { [limitField]: { decrement: 1 } },
		});
		if (limit.count === 0) throw new CreateQuestionError("Limite diário de perguntas atingido", 429);

		const debit = await tx.user.updateMany({
			where: { id: input.askerId, credits_cents: { gte: input.amountCents } },
			data: { credits_cents: { decrement: input.amountCents } },
		});
		if (debit.count === 0) throw new CreateQuestionError("Créditos insuficientes", 400);

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
