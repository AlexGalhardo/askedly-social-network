import { toPublicQuestion } from "@/lib/utils/question-privacy";
import { prisma } from "@/prisma/prisma-client";

// Estas consultas alimentam páginas públicas e vão serializadas para o browser: só campos públicos do usuário,
// nunca `include: true` (que levaria hash de senha, email, chave PIX e api_key).
const publicQuestionInclude = {
	owner: {
		select: {
			id: true,
			nickname: true,
			name: true,
			avatar_url: true,
			privacy_is_private_profile: true,
			privacy_show_questions_answered_only_to_followers: true,
			privacy_show_likes_each_answer_public: true,
			privacy_show_dislikes_each_answer_public: true,
			privacy_show_value_received_from_answering_question: true,
		},
	},
	asked_by: { select: { nickname: true, name: true, avatar_url: true } },
} as const;

// O ranking é uma página estática, sem saber quem está vendo: perfis restritos (privados ou com respostas só para
// seguidores) ficam de fora de vez. O feed, que conhece o visitante, filtra em lib/services/feed.service.ts.
const publicRankingOwner = {
	privacy_is_private_profile: false,
	privacy_show_questions_answered_only_to_followers: false,
};

class QuestionsRepository {
	async getAllLatestDescPublicQuestionsAnswered() {
		const allQuestions = await prisma.question.findMany({
			include: publicQuestionInclude,
			where: {
				question_answered: true,
				answered_at: {
					not: null,
				},
				asker_want_answer_to_be_private: false,
			},
			orderBy: {
				created_at: "desc",
			},
		});

		return allQuestions;
	}

	async getFollowingQuestionsAnswered(userNickname: string) {
		const followingUsers = await prisma.follower.findMany({
			where: {
				follower: {
					nickname: userNickname,
				},
			},
			select: {
				following: {
					select: {
						nickname: true,
					},
				},
			},
		});

		const followingNicknames = followingUsers.map((f) => f.following.nickname);

		if (followingNicknames.length === 0) {
			return [];
		}

		const followingQuestions = await prisma.question.findMany({
			include: publicQuestionInclude,
			where: {
				question_answered: true,
				answered_at: {
					not: null,
				},
				asker_want_answer_to_be_private: false,
				owner_user_nickname: {
					in: followingNicknames,
				},
			},
			orderBy: {
				answered_at: "desc",
			},
		});

		return followingQuestions;
	}

	async getTopLikedAnswersToday() {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		return await prisma.question.findMany({
			include: publicQuestionInclude,
			where: {
				question_answered: true,
				answered_at: {
					not: null,
				},
				created_at: {
					gte: today,
					lt: tomorrow,
				},
				asker_want_answer_to_be_private: false,
				owner: publicRankingOwner,
				liked_by_users: {
					not: null,
				},
			},
			orderBy: [
				{
					created_at: "desc",
				},
			],
			take: 10,
		});
	}

	async getTopLikedAnswersThisWeek() {
		const today = new Date();
		const startOfWeek = new Date(today);
		startOfWeek.setDate(today.getDate() - today.getDay());
		startOfWeek.setHours(0, 0, 0, 0);

		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(startOfWeek.getDate() + 7);

		return await prisma.question.findMany({
			include: publicQuestionInclude,
			where: {
				question_answered: true,
				answered_at: {
					not: null,
				},
				created_at: {
					gte: startOfWeek,
					lt: endOfWeek,
				},
				asker_want_answer_to_be_private: false,
				owner: publicRankingOwner,
				liked_by_users: {
					not: null,
				},
			},
			orderBy: [
				{
					created_at: "desc",
				},
			],
			take: 10,
		});
	}

	async getTopLikedAnswersThisMonth() {
		const today = new Date();
		const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
		const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

		return await prisma.question.findMany({
			include: publicQuestionInclude,
			where: {
				question_answered: true,
				answered_at: {
					not: null,
				},
				created_at: {
					gte: startOfMonth,
					lt: endOfMonth,
				},
				asker_want_answer_to_be_private: false,
				owner: publicRankingOwner,
				liked_by_users: {
					not: null,
				},
			},
			orderBy: [
				{
					created_at: "desc",
				},
			],
			take: 10,
		});
	}

	async getTopLikedAnswersThisYear() {
		const today = new Date();
		const startOfYear = new Date(today.getFullYear(), 0, 1);
		const endOfYear = new Date(today.getFullYear() + 1, 0, 1);

		return await prisma.question.findMany({
			include: publicQuestionInclude,
			where: {
				question_answered: true,
				answered_at: {
					not: null,
				},
				created_at: {
					gte: startOfYear,
					lt: endOfYear,
				},
				asker_want_answer_to_be_private: false,
				owner: publicRankingOwner,
				liked_by_users: {
					not: null,
				},
			},
			orderBy: [
				{
					created_at: "desc",
				},
			],
			take: 10,
		});
	}

	async getTopLikedAnswersAllTime() {
		return await prisma.question.findMany({
			include: publicQuestionInclude,
			where: {
				question_answered: true,
				answered_at: {
					not: null,
				},
				asker_want_answer_to_be_private: false,
				owner: publicRankingOwner,
				liked_by_users: {
					not: null,
				},
			},
			orderBy: [
				{
					created_at: "desc",
				},
			],
			take: 10,
		});
	}

	async getUserQuestionsAnsweredPaymentDetails(nickname: string) {
		const paymentReadyQuestions = await prisma.question.findMany({
			where: {
				owner_user_nickname: nickname,
				question_answered: true,
				question_is_awaiting_answer: false,
				amount_already_withdraw: false,
			},
		});

		const paymentAwaitingAnswerQuestions = await prisma.question.findMany({
			where: {
				owner_user_nickname: nickname,
				question_is_awaiting_answer: true,
				amount_already_withdraw: false,
				question_answer_was_expired: false,
				onwer_reported_question_at: null,
				question_answer_recused_at: null,
				question_answer_expired_at: null,
			},
			select: {
				amount_paid: true,
			},
		});

		const paymentWithdrawHistory = await prisma.user.findUnique({
			where: {
				nickname: nickname,
			},
			select: {
				payment_withdraws: {
					orderBy: {
						created_at: "desc",
					},
				},
			},
		});

		const calculatePayment = (amount: number) => {
			if (amount <= 500) {
				return Math.ceil(amount * 0.5);
			} else {
				return Math.ceil(amount * 0.7);
			}
		};

		const paymentReadyTotal = paymentReadyQuestions.reduce((total, question) => {
			return total + calculatePayment(question.amount_paid || 0);
		}, 0);

		const paymentAwaitingAnswerTotal = paymentAwaitingAnswerQuestions.reduce((total, question) => {
			return total + calculatePayment(question.amount_paid || 0);
		}, 0);

		return {
			paymentToWithdraw: paymentReadyTotal,
			paymentAwaitingAnswer: paymentAwaitingAnswerTotal,
			paymentWithdrawHistory: paymentWithdrawHistory?.payment_withdraws || [],
			questionsToPayAmount: paymentReadyQuestions,
		};
	}

	async getUserQuestionsSentPaymentDetails(nickname: string) {
		const paymentSentAnsweredQuestions = await prisma.question.findMany({
			where: {
				asked_by_user_nickname: nickname,
				question_answered: true,
				question_is_awaiting_answer: false,
			},
			select: {
				amount_paid: true,
				amount_already_withdraw: true,
			},
		});

		const paymentAwaitingAnswerQuestions = await prisma.question.findMany({
			where: {
				asked_by_user_nickname: nickname,
				question_is_awaiting_answer: true,
				question_answer_was_expired: false,
				question_answer_was_recused: false,
				onwer_reported_question_at: null,
				question_answer_recused_at: null,
				question_answer_expired_at: null,
			},
			select: {
				amount_paid: true,
			},
		});

		const questionsAvailableForWithdraw = await prisma.question.findMany({
			where: {
				asked_by_user_nickname: nickname,
				amount_already_withdraw: false,
				payment_withdraw_id: null,
				OR: [
					{ question_answer_was_recused: true },
					{ question_answer_was_expired: true },
					{ onwer_reported_question_at: { not: null } },
					{ question_answer_recused_at: { not: null } },
					{ question_answer_expired_at: { not: null } },
				],
			},
			select: {
				id: true,
				amount_paid: true,
			},
		});

		const paymentWithdrawHistory = await prisma.user.findUnique({
			where: {
				nickname: nickname,
			},
			select: {
				payment_withdraws: {
					orderBy: {
						created_at: "desc",
					},
				},
			},
		});

		const calculateRefund = (amount: number) => {
			if (amount <= 500) {
				return Math.ceil(amount * 0.5);
			} else {
				return Math.ceil(amount * 0.7);
			}
		};

		const paymentSentAnsweredQuestionsTotal = paymentSentAnsweredQuestions.reduce((total, question) => {
			return total + (question.amount_paid || 0);
		}, 0);

		const paymentAwaitingAnswerTotal = paymentAwaitingAnswerQuestions.reduce((total, question) => {
			return total + (question.amount_paid || 0);
		}, 0);

		const paymentToWithdrawTotal = questionsAvailableForWithdraw.reduce((total, question) => {
			return total + calculateRefund(question.amount_paid || 0);
		}, 0);

		const result = {
			paymentToWithdraw: paymentToWithdrawTotal,
			paymentAwaitingAnswer: paymentAwaitingAnswerTotal,
			paymentSentAnsweredQuestions: paymentSentAnsweredQuestionsTotal,
			paymentWithdrawHistory: paymentWithdrawHistory?.payment_withdraws || [],
			questionsToPayAmount: questionsAvailableForWithdraw,
		};

		return result;
	}
}

const repo = new QuestionsRepository();

export async function getAllLatestDescPublicQuestionsAnswered() {
	return (await repo.getAllLatestDescPublicQuestionsAnswered()).map(toPublicQuestion);
}

export async function getFollowingQuestionsAnswered(userNickname: string) {
	return (await repo.getFollowingQuestionsAnswered(userNickname)).map(toPublicQuestion);
}

export async function getTopLikedAnswersToday() {
	return (await repo.getTopLikedAnswersToday()).map(toPublicQuestion);
}

export async function getTopLikedAnswersThisWeek() {
	return (await repo.getTopLikedAnswersThisWeek()).map(toPublicQuestion);
}

export async function getTopLikedAnswersThisMonth() {
	return (await repo.getTopLikedAnswersThisMonth()).map(toPublicQuestion);
}

export async function getTopLikedAnswersThisYear() {
	return (await repo.getTopLikedAnswersThisYear()).map(toPublicQuestion);
}

export async function getTopLikedAnswersAllTime() {
	return (await repo.getTopLikedAnswersAllTime()).map(toPublicQuestion);
}

export async function getUserQuestionsAnsweredPaymentDetails(nickname: string) {
	return repo.getUserQuestionsAnsweredPaymentDetails(nickname);
}

export async function getUserQuestionsSentPaymentDetails(nickname: string) {
	return repo.getUserQuestionsSentPaymentDetails(nickname);
}

/** Pergunta como as páginas públicas (feed, top curtidas) a recebem. */
export type PublicQuestion = Awaited<ReturnType<typeof getAllLatestDescPublicQuestionsAnswered>>[number];
