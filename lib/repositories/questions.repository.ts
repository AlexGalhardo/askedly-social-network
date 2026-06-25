"use server";

import { prisma } from "@/prisma/prisma-client";

class QuestionsRepository {
	async getAllLatestDescPublicQuestionsAnswered(): Promise<any[]> {
		const allQuestions = await prisma.question.findMany({
			include: {
				owner: true,
				asked_by: true,
			},
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

	async getFollowingQuestionsAnswered(userNickname: string): Promise<any[]> {
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
			include: {
				owner: true,
				asked_by: true,
			},
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

	async getTopLikedAnswersToday(): Promise<any[]> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		return await prisma.question.findMany({
			include: {
				owner: true,
				asked_by: true,
			},
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

	async getTopLikedAnswersThisWeek(): Promise<any[]> {
		const today = new Date();
		const startOfWeek = new Date(today);
		startOfWeek.setDate(today.getDate() - today.getDay());
		startOfWeek.setHours(0, 0, 0, 0);

		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(startOfWeek.getDate() + 7);

		return await prisma.question.findMany({
			include: {
				owner: true,
				asked_by: true,
			},
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

	async getTopLikedAnswersThisMonth(): Promise<any[]> {
		const today = new Date();
		const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
		const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

		return await prisma.question.findMany({
			include: {
				owner: true,
				asked_by: true,
			},
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

	async getTopLikedAnswersThisYear(): Promise<any[]> {
		const today = new Date();
		const startOfYear = new Date(today.getFullYear(), 0, 1);
		const endOfYear = new Date(today.getFullYear() + 1, 0, 1);

		return await prisma.question.findMany({
			include: {
				owner: true,
				asked_by: true,
			},
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

	async getTopLikedAnswersAllTime(): Promise<any[]> {
		return await prisma.question.findMany({
			include: {
				owner: true,
				asked_by: true,
			},
			where: {
				question_answered: true,
				answered_at: {
					not: null,
				},
				asker_want_answer_to_be_private: false,
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
	return repo.getAllLatestDescPublicQuestionsAnswered();
}

export async function getFollowingQuestionsAnswered(userNickname: string) {
	return repo.getFollowingQuestionsAnswered(userNickname);
}

export async function getTopLikedAnswersToday() {
	return repo.getTopLikedAnswersToday();
}

export async function getTopLikedAnswersThisWeek() {
	return repo.getTopLikedAnswersThisWeek();
}

export async function getTopLikedAnswersThisMonth() {
	return repo.getTopLikedAnswersThisMonth();
}

export async function getTopLikedAnswersThisYear() {
	return repo.getTopLikedAnswersThisYear();
}

export async function getTopLikedAnswersAllTime() {
	return repo.getTopLikedAnswersAllTime();
}

export async function getUserQuestionsAnsweredPaymentDetails(nickname: string) {
	return repo.getUserQuestionsAnsweredPaymentDetails(nickname);
}

export async function getUserQuestionsSentPaymentDetails(nickname: string) {
	return repo.getUserQuestionsSentPaymentDetails(nickname);
}
