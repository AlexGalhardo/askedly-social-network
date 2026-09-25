import { QuestionInterface, QuestionStatus } from "@/types/QuestionInterface";

export const QUESTION_ANSWER_WINDOW_HOURS = 7 * 24;

export function isQuestionExpired(createdAt: string | Date): boolean {
	const created = new Date(createdAt);
	const now = new Date();
	const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
	return diffInHours >= QUESTION_ANSWER_WINDOW_HOURS;
}

export function getTimeRemaining(createdAt: string | Date): {
	hours: number;
	minutes: number;
	seconds: number;
	isExpired: boolean;
} {
	const created = new Date(createdAt);
	const now = new Date();
	const expirationTime = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
	const timeLeft = expirationTime.getTime() - now.getTime();

	if (timeLeft <= 0) {
		return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
	}

	const hours = Math.floor(timeLeft / (1000 * 60 * 60));
	const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

	return { hours, minutes, seconds, isExpired: false };
}

export function paginateQuestions(questions: QuestionInterface[], currentPage: number, questionsPerPage: number) {
	const startIndex = (currentPage - 1) * questionsPerPage;
	const endIndex = startIndex + questionsPerPage;
	const paginatedQuestions = questions.slice(startIndex, endIndex);
	const totalPages = Math.ceil(questions.length / questionsPerPage);

	return {
		questions: paginatedQuestions,
		totalPages,
		currentPage,
		hasNextPage: currentPage < totalPages,
		hasPreviousPage: currentPage > 1,
	};
}

// A ordem importa: respondida > reportada > recusada > expirada > pendente. Uma pergunta respondida
// nunca conta como expirada, mesmo depois do prazo.
export function getQuestionStatus(question: QuestionInterface): QuestionStatus {
	if (
		question.question_answered === true &&
		question.question_is_awaiting_answer === false &&
		question.answer_text !== null &&
		question.answered_at !== null &&
		!question.onwer_reported_question_at &&
		!question.question_answer_recused_at &&
		!question.question_answer_expired_at &&
		question.question_answer_was_recused === false &&
		question.question_answer_was_expired === false &&
		question.owner_reported_offensive_question === false &&
		question.onwer_reported_inadequate_question === false
	) {
		return "answered";
	}

	if (
		question.owner_reported_offensive_question === true ||
		question.onwer_reported_inadequate_question === true ||
		question.onwer_reported_question_at !== null
	) {
		return "reported";
	}

	if (question.question_answer_was_recused === true || question.question_answer_recused_at !== null) {
		return "declined";
	}

	if (question.question_answer_was_expired === true || question.question_answer_expired_at !== null) {
		return "expired";
	}

	if (isQuestionExpired(question.created_at)) {
		return "expired";
	}

	if (
		question.question_is_awaiting_answer === true &&
		question.question_answered === false &&
		question.question_answer_was_recused === false &&
		question.question_answer_was_expired === false &&
		question.owner_reported_offensive_question === false &&
		question.onwer_reported_inadequate_question === false &&
		!question.onwer_reported_question_at &&
		!question.question_answer_recused_at &&
		!question.question_answer_expired_at
	) {
		return "pending";
	}

	return "pending";
}

export function getDeleteTimer(declinedAt: string): string {
	const now = new Date().getTime();
	const declined = new Date(declinedAt).getTime();
	const deleteTime = declined + 7 * 24 * 60 * 60 * 1000;
	const diff = deleteTime - now;

	if (diff <= 0) return "Pronto para deletar";

	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((diff % (1000 * 60)) / 1000);

	return `${days}d ${hours}h ${minutes}m ${seconds}s para pergunta ser deletada`;
}

export function sortQuestionsByDate(questions: QuestionInterface[]): QuestionInterface[] {
	return [...questions].sort((a, b) => {
		if (a.question_answered && b.question_answered) {
			const dateA = new Date(a.answered_at || a.created_at);
			const dateB = new Date(b.answered_at || b.created_at);
			return dateB.getTime() - dateA.getTime(); // DESC
		}

		if (a.question_answer_was_recused && b.question_answer_was_recused) {
			const dateA = new Date(a.question_answer_recused_at || a.created_at);
			const dateB = new Date(b.question_answer_recused_at || b.created_at);
			return dateB.getTime() - dateA.getTime(); // DESC
		}

		if (a.question_answer_was_expired && b.question_answer_was_expired) {
			const dateA = new Date(a.question_answer_expired_at || a.created_at);
			const dateB = new Date(b.question_answer_expired_at || b.created_at);
			return dateB.getTime() - dateA.getTime(); // DESC
		}

		if (
			(a.owner_reported_offensive_question || a.onwer_reported_inadequate_question) &&
			(b.owner_reported_offensive_question || b.onwer_reported_inadequate_question)
		) {
			const dateA = new Date(a.onwer_reported_question_at || a.created_at);
			const dateB = new Date(b.onwer_reported_question_at || b.created_at);
			return dateB.getTime() - dateA.getTime(); // DESC
		}

		const dateA = new Date(a.created_at);
		const dateB = new Date(b.created_at);
		return dateB.getTime() - dateA.getTime(); // DESC
	});
}

export function filterQuestionsByStatus(questions: QuestionInterface[], status: QuestionStatus): QuestionInterface[] {
	if (!Array.isArray(questions)) return [];

	let filteredQuestions: QuestionInterface[] = [];

	switch (status) {
		case "answered":
			filteredQuestions = questions.filter(
				(q) =>
					q.question_answered === true &&
					q.question_is_awaiting_answer === false &&
					q.answer_text !== null &&
					q.answered_at !== null &&
					!q.onwer_reported_question_at &&
					!q.question_answer_recused_at &&
					!q.question_answer_expired_at &&
					q.question_answer_was_recused === false &&
					q.question_answer_was_expired === false &&
					q.owner_reported_offensive_question === false &&
					q.onwer_reported_inadequate_question === false,
			);
			break;

		case "reported":
			filteredQuestions = questions.filter(
				(q) =>
					!q.question_answered &&
					!q.question_answer_was_recused &&
					!q.question_answer_was_expired &&
					(q.owner_reported_offensive_question === true ||
						q.onwer_reported_inadequate_question === true ||
						q.onwer_reported_question_at !== null),
			);
			break;

		case "declined":
			filteredQuestions = questions.filter(
				(q) =>
					!q.question_answered &&
					!q.question_answer_was_expired &&
					(q.question_answer_was_recused === true || q.question_answer_recused_at !== null),
			);
			break;

		case "expired":
			filteredQuestions = questions.filter((q) => {
				if (q.question_answered) return false;

				if (
					q.owner_reported_offensive_question ||
					q.onwer_reported_inadequate_question ||
					q.onwer_reported_question_at
				)
					return false;

				if (q.question_answer_was_recused || q.question_answer_recused_at) return false;

				return q.question_answer_was_expired || q.question_answer_expired_at || isQuestionExpired(q.created_at);
			});
			break;

		case "pending":
			filteredQuestions = questions.filter(
				(q) =>
					!q.question_answered &&
					!q.question_answer_was_recused &&
					!q.question_answer_was_expired &&
					!q.owner_reported_offensive_question &&
					!q.onwer_reported_inadequate_question &&
					!q.onwer_reported_question_at &&
					!q.question_answer_recused_at &&
					!q.question_answer_expired_at &&
					!isQuestionExpired(q.created_at) &&
					q.question_is_awaiting_answer === true,
			);
			break;

		default:
			filteredQuestions = questions;
	}

	return sortQuestionsByDate(filteredQuestions);
}
