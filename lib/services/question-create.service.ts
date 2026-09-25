import { randomUUID } from "node:crypto";
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
	/** Só no modo de teste: não há PIX real, então um webhook fictício é criado com este valor. */
	testModeAmount?: number;
}

/**
 * Cria a pergunta ligada a um pagamento PIX confirmado. O valor registrado é o do webhook pago,
 * nunca um valor informado pelo client: ele define o repasse ao dono e o reembolso a quem perguntou.
 */
export async function createPaidQuestion(input: CreatePaidQuestionInput) {
	return prisma.$transaction(async (tx) => {
		const [owner, asker] = await Promise.all([
			tx.user.findUnique({ where: { id: input.ownerId }, select: { nickname: true } }),
			tx.user.findUnique({ where: { id: input.askerId }, select: { nickname: true } }),
		]);
		if (!owner) throw new CreateQuestionError("Usuário proprietário não encontrado", 404);
		if (!asker) throw new CreateQuestionError("Usuário que fez o pagamento não encontrado", 404);

		const webhook =
			input.testModeAmount === undefined
				? await tx.webhookAbacatePay.findUnique({ where: { pix_id: input.pixId }, include: { question: true } })
				: await tx.webhookAbacatePay.create({
						data: {
							pix_id: `pix_char_DEVMODE_${randomUUID()}`,
							status: "completed",
							amount: input.testModeAmount,
							fee: 0,
							kind: "payment",
							event_status: "received",
							dev_mode: true,
							complete_event: "payment.completed",
						},
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
