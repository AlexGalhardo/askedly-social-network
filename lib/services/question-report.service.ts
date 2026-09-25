import { prisma } from "@/prisma/prisma-client";

export type ReportReason = "offensive" | "inappropriate";

/**
 * O dono denuncia a pergunta recebida, o que também a tira da fila de resposta. A condição de dono vai no próprio
 * `updateMany`, então checagem e escrita são uma operação só.
 */
export async function reportQuestion(
	questionId: string,
	ownerNickname: string,
	reason: ReportReason,
): Promise<boolean> {
	const { count } = await prisma.question.updateMany({
		where: { id: questionId, owner_user_nickname: ownerNickname },
		data: {
			...(reason === "offensive"
				? { owner_reported_offensive_question: true }
				: { onwer_reported_inadequate_question: true }),
			onwer_reported_question_at: new Date(),
			question_is_awaiting_answer: false,
		},
	});
	return count === 1;
}

/** Quem perguntou denuncia a resposta recebida: uma vez só, e só depois de respondida. */
export async function reportAnswer(questionId: string, askerNickname: string, reason: ReportReason): Promise<boolean> {
	const { count } = await prisma.question.updateMany({
		where: {
			id: questionId,
			asked_by_user_nickname: askerNickname,
			question_answered: true,
			asker_reported_answer: false,
		},
		data: {
			asker_reported_answer: true,
			asker_reported_answer_reason: reason,
			asker_reported_answer_at: new Date(),
		},
	});
	return count === 1;
}
