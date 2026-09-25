import { SentQuestionInterface, SentQuestionStatus } from "@/types/SentQuestion";

export function isSentQuestionExpired(createdAt: string | Date): boolean {
	const created = new Date(createdAt);
	const now = new Date();
	const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
	return diffInHours >= 168; // 7 dias em horas
}

export function getSentQuestionStatus(question: SentQuestionInterface): SentQuestionStatus {
	if (question.question_answered) return "answered";

	if (question.question_answer_was_recused) return "declined";

	if (question.question_answer_was_expired) return "expired";

	if (isSentQuestionExpired(question.created_at)) return "expired";

	if (question.question_is_awaiting_answer) return "pending";

	return "pending";
}

export function filterSentQuestionsByStatus(
	questions: SentQuestionInterface[],
	status: SentQuestionStatus,
): SentQuestionInterface[] {
	return questions
		.filter((q) => {
			switch (status) {
				case "answered":
					return q.question_answered;
				case "declined":
					return !q.question_answered && q.question_answer_was_recused;
				case "expired":
					return (
						!q.question_answered &&
						!q.question_answer_was_recused &&
						(q.question_answer_was_expired || isSentQuestionExpired(q.created_at))
					);
				case "pending":
					return (
						!q.question_answered &&
						!q.question_answer_was_recused &&
						!q.question_answer_was_expired &&
						!isSentQuestionExpired(q.created_at) &&
						(q.question_is_awaiting_answer ||
							(!q.question_answered && !q.question_answer_was_recused && !q.question_answer_was_expired))
					);
				default:
					return false;
			}
		})
		.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function paginateSentQuestions(questions: SentQuestionInterface[], page: number, perPage: number) {
	const startIndex = (page - 1) * perPage;
	const endIndex = startIndex + perPage;
	return {
		questions: questions.slice(startIndex, endIndex),
		totalPages: Math.ceil(questions.length / perPage),
		hasNextPage: endIndex < questions.length,
		hasPrevPage: page > 1,
	};
}

export function calculateFinancialData(questions: SentQuestionInterface[]) {
	return {
		totalPaid: questions.filter((q) => q.question_answered).reduce((sum, q) => sum + q.amount_paid, 0),
		totalDeclined: questions
			.filter((q) => !q.question_answered && q.question_answer_was_recused)
			.reduce((sum, q) => sum + q.amount_paid, 0),
		totalExpired: questions
			.filter(
				(q) =>
					!q.question_answered &&
					!q.question_answer_was_recused &&
					(q.question_answer_was_expired || isSentQuestionExpired(q.created_at)),
			)
			.reduce((sum, q) => sum + q.amount_paid, 0),
	};
}
