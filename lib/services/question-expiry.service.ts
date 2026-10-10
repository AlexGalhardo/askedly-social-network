import { QUESTION_ANSWER_WINDOW_HOURS } from "@/lib/utils/question-utils";
import { prisma } from "@/prisma/prisma-client";

/**
 * Marks as expired an unanswered question whose deadline has passed, if `nickname` takes part in it.
 * The deadline is checked on the server: expiring releases the refund to the asker.
 */
export async function expireQuestion(questionId: string, nickname: string): Promise<boolean> {
	const deadline = new Date(Date.now() - QUESTION_ANSWER_WINDOW_HOURS * 60 * 60 * 1000);

	const { count } = await prisma.question.updateMany({
		where: {
			id: questionId,
			OR: [{ owner_user_nickname: nickname }, { asked_by_user_nickname: nickname }],
			question_is_awaiting_answer: true,
			question_answered: false,
			created_at: { lte: deadline },
		},
		data: {
			question_is_awaiting_answer: false,
			question_answer_was_expired: true,
			question_answer_was_recused: false,
			question_answer_expired_at: new Date(),
		},
	});

	return count === 1;
}
