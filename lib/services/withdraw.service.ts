import { prisma } from "@/prisma/prisma-client";

export type WithdrawErrorKey = "noQuestions" | "userNotFound" | "noPixKey" | "invalidQuestions";

/** `message` is a `payments.withdrawErrors` key; whoever catches it translates. */
export class WithdrawError extends Error {
	declare message: WithdrawErrorKey;

	constructor(key: WithdrawErrorKey) {
		super(key);
	}
}

/** Amount paid out to the user, in cents, for a paid question (answer or refund). */
export function calculatePayout(amountPaidInCents: number): number {
	return Math.ceil(amountPaidInCents * (amountPaidInCents <= 500 ? 0.5 : 0.7));
}

/**
 * Withdraws the balance of the given questions to the user's own registered PIX key.
 * The caller must pass the id coming from the session, never from the request body.
 */
export async function withdrawBalance(
	userId: string,
	questionIds: string[],
): Promise<{ withdrawId: string; amount: number }> {
	const ids = [...new Set(questionIds)];
	if (ids.length === 0) throw new WithdrawError("noQuestions");

	const user = await prisma.user.findUnique({ where: { id: userId }, select: { nickname: true, pix_key: true } });
	if (!user) throw new WithdrawError("userNotFound");
	if (!user.pix_key) throw new WithdrawError("noPixKey");

	return prisma.$transaction(async (tx) => {
		const questions = await tx.question.findMany({
			where: {
				id: { in: ids },
				currency: "BRL",
				amount_already_withdraw: false,
				OR: [
					{
						owner_user_nickname: user.nickname,
						question_answered: true,
						question_is_awaiting_answer: false,
					},
					{
						asked_by_user_nickname: user.nickname,
						payment_withdraw_id: null,
						OR: [
							{ question_answer_was_recused: true },
							{ question_answer_was_expired: true },
							{ onwer_reported_question_at: { not: null } },
							{ question_answer_recused_at: { not: null } },
							{ question_answer_expired_at: { not: null } },
						],
					},
				],
			},
			select: { id: true, amount_paid: true },
		});

		if (questions.length !== ids.length) {
			throw new WithdrawError("invalidQuestions");
		}

		// The filter on amount_already_withdraw makes the UPDATE wait for the row lock: a concurrent withdrawal of the
		// same questions finds a smaller count, throws and rolls back the whole transaction.
		const claimed = await tx.question.updateMany({
			where: { id: { in: ids }, amount_already_withdraw: false },
			data: { amount_already_withdraw: true },
		});
		if (claimed.count !== ids.length) {
			throw new WithdrawError("invalidQuestions");
		}

		const amount = questions.reduce((total, question) => total + calculatePayout(question.amount_paid), 0);

		const withdraw = await tx.paymentWithdraw.create({
			data: {
				user_id: userId,
				user_nickname: user.nickname,
				send_to_pix_key: user.pix_key as string,
				amount_withdraw: amount,
				questions: { connect: ids.map((id) => ({ id })) },
			},
		});

		return { withdrawId: withdraw.id, amount };
	});
}
