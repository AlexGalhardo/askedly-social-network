import { SentQuestionInterface, SentQuestionStatus } from "@/types/SentQuestion";

// Função para verificar se uma pergunta expirou (7 dias)
export function isSentQuestionExpired(createdAt: string | Date): boolean {
	const created = new Date(createdAt);
	const now = new Date();
	const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
	return diffInHours >= 168; // 7 dias em horas
}

export function getSentQuestionStatus(question: SentQuestionInterface): SentQuestionStatus {
	// PRIMEIRO: Verifica se foi respondida (prioridade máxima)
	if (question.question_answered) return "answered";

	// SEGUNDO: Verifica se foi recusada
	if (question.question_answer_was_recused) return "declined";

	// TERCEIRO: Verifica se expirou explicitamente
	if (question.question_answer_was_expired) return "expired";

	// QUARTO: Verifica se expirou por tempo (só se não foi respondida/recusada)
	if (isSentQuestionExpired(question.created_at)) return "expired";

	// QUINTO: Se está aguardando resposta
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
					// PRIORIDADE: Perguntas respondidas (independente do tempo)
					return q.question_answered;
				case "declined":
					// Perguntas recusadas (não respondidas)
					return !q.question_answered && q.question_answer_was_recused;
				case "expired":
					// Perguntas expiradas (não respondidas, não recusadas)
					return (
						!q.question_answered &&
						!q.question_answer_was_recused &&
						(q.question_answer_was_expired || isSentQuestionExpired(q.created_at))
					);
				case "pending":
					// Perguntas pendentes (não respondidas, não recusadas, não expiradas)
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
