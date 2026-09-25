import { prisma } from "@/prisma/prisma-client";

export class WithdrawError extends Error {}

/** Valor repassado ao usuário, em centavos, por uma pergunta paga (resposta ou reembolso). */
export function calculatePayout(amountPaidInCents: number): number {
	return Math.ceil(amountPaidInCents * (amountPaidInCents <= 500 ? 0.5 : 0.7));
}

/**
 * Saca o saldo das perguntas informadas para a chave PIX cadastrada do próprio usuário.
 * Quem chama deve passar o id vindo da sessão, nunca do body da requisição.
 */
export async function withdrawBalance(
	userId: string,
	questionIds: string[],
): Promise<{ withdrawId: string; amount: number }> {
	const ids = [...new Set(questionIds)];
	if (ids.length === 0) throw new WithdrawError("Nenhuma pergunta selecionada para saque.");

	const user = await prisma.user.findUnique({ where: { id: userId }, select: { nickname: true, pix_key: true } });
	if (!user) throw new WithdrawError("Usuário não encontrado.");
	if (!user.pix_key) throw new WithdrawError("Cadastre uma chave PIX antes de sacar.");

	return prisma.$transaction(async (tx) => {
		const questions = await tx.question.findMany({
			where: {
				id: { in: ids },
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
			throw new WithdrawError("Algumas perguntas são inválidas ou já foram sacadas.");
		}

		// O filtro em amount_already_withdraw faz o UPDATE esperar o lock da linha: um saque concorrente das
		// mesmas perguntas encontra count menor, lança e desfaz a transação inteira.
		const claimed = await tx.question.updateMany({
			where: { id: { in: ids }, amount_already_withdraw: false },
			data: { amount_already_withdraw: true },
		});
		if (claimed.count !== ids.length) {
			throw new WithdrawError("Algumas perguntas são inválidas ou já foram sacadas.");
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
