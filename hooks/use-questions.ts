"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QuestionInterface } from "@/types/QuestionInterface";
import {
	getAllLatestDescPublicQuestionsAnswered,
	getFollowingQuestionsAnswered,
} from "@/lib/repositories/questions.repository";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

const QUESTIONS_PER_PAGE = 10;

interface QuestionsPageData {
	questions: QuestionInterface[];
	nextCursor: number | undefined;
	hasMore: boolean;
	total: number;
}

interface QuestionsError {
	message: string;
	status?: number;
}

interface LikeDislikeParams {
	questionId: string;
	nickname: string;
}

interface ApiResponse {
	success: boolean;
	message?: string;
	data?: any;
}

export type FeedType = "community" | "following";

export const useQuestions = (feedType: FeedType = "community", userNickname?: string) => {
	const { toast } = useToast();

	const queryResult = useInfiniteQuery<QuestionsPageData, QuestionsError>({
		queryKey: ["questions", "public", "answered", feedType, userNickname],
		queryFn: async ({ pageParam = 0 }): Promise<QuestionsPageData> => {
			let allQuestions: QuestionInterface[] = [];

			if (feedType === "following" && userNickname) {
				allQuestions = await getFollowingQuestionsAnswered(userNickname);
			} else {
				allQuestions = await getAllLatestDescPublicQuestionsAnswered();
			}

			const start = (pageParam as number) * QUESTIONS_PER_PAGE;
			const end = start + QUESTIONS_PER_PAGE;

			return {
				questions: allQuestions.slice(start, end),
				nextCursor: end < allQuestions.length ? (pageParam as number) + 1 : undefined,
				hasMore: end < allQuestions.length,
				total: allQuestions.length,
			};
		},
		getNextPageParam: (lastPage: QuestionsPageData) => lastPage.nextCursor,
		initialPageParam: 0,
		staleTime: 1000 * 60 * 5, // 5 minutos
		refetchOnWindowFocus: true,
		refetchInterval: 1000 * 60 * 2, // 2 minutos
		retry: 3,
		retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
		throwOnError: false,
		enabled: feedType === "community" || (feedType === "following" && !!userNickname),
	});

	if (queryResult.error) {
		toast({
			title: "Erro ao carregar perguntas",
			description: queryResult.error?.message || "Aconteceu um erro inesperado",
			variant: "error",
		});
	}

	return queryResult;
};

export function useReceivedQuestions() {
	const { data: session } = useSession();
	const [questions, setQuestions] = useState<QuestionInterface[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (session?.user?.questions_received) {
			const formattedQuestions: QuestionInterface[] = session.user.questions_received.map((q: any) => ({
				id: q.id,
				is_seed: q.is_seed || false,
				question_text: q.question_text,
				answer_text: q.answer_text || null,
				answered_at: q.answered_at || null,
				amount_paid: q.amount_paid || 0,
				amount_already_withdraw: q.amount_already_withdraw || false,
				asker_want_answer_to_be_private: q.asker_want_answer_to_be_private || false,
				asker_sent_anonymous_question: q.asker_sent_anonymous_question || false,
				amount_paid_is_private: q.amount_paid_is_private || false,
				onwer_wants_amount_paid_not_show_public: q.onwer_wants_amount_paid_not_show_public || false,
				owner_user_nickname: q.owner_user_nickname,
				asked_by_user_nickname: q.asked_by_user_nickname,
				question_is_awaiting_answer: q.question_is_awaiting_answer || false,
				question_answered: q.question_answered || false,
				question_answer_was_recused: q.question_answer_was_recused || false,
				question_answer_was_expired: q.question_answer_was_expired || false,
				question_answer_recused_at: q.question_answer_recused_at || null,
				question_answer_expired_at: q.question_answer_expired_at || null,
				liked_by_users: q.liked_by_users || null,
				desliked_by_users: q.desliked_by_users || null,
				owner_reported_offensive_question: q.owner_reported_offensive_question || false,
				onwer_reported_inadequate_question: q.onwer_reported_inadequate_question || false,
				onwer_reported_question_at: q.onwer_reported_question_at || null,
				asker_reported_answer: q.asker_reported_answer || false,
				asker_reported_answer_reason: q.asker_reported_answer_reason || null,
				asker_reported_answer_at: q.asker_reported_answer_at || null,
				payment_withdraw_id: q.payment_withdraw_id || null,
				created_at: q.created_at,
				updated_at: q.updated_at || null,
				deleted_at: q.deleted_at || null,
				webhook_id: q.webhook_id,
				owner: q.owner
					? {
							id: q.owner.id,
							name: q.owner.name,
							nickname: q.owner.nickname,
							email: q.owner.email,
							avatar_url: q.owner.avatar_url || null,
							description: q.owner.description || null,
							website: q.owner.website || null,
							twitter: q.owner.twitter || null,
							instagram: q.owner.instagram || null,
							youtube: q.owner.youtube || null,
							tiktok: q.owner.tiktok || null,
							linkedin: q.owner.linkedin || null,
							twitch: q.owner.twitch || null,
							facebook: q.owner.facebook || null,
							github: q.owner.github || null,
							created_at: q.owner.created_at,
						}
					: null,
				asked_by: q.asked_by
					? {
							id: q.asked_by.id,
							name: q.asked_by.name,
							nickname: q.asked_by.nickname,
							email: q.asked_by.email,
							avatar_url: q.asked_by.avatar_url || null,
							description: q.asked_by.description || null,
							website: q.asked_by.website || null,
							twitter: q.asked_by.twitter || null,
							instagram: q.asked_by.instagram || null,
							youtube: q.asked_by.youtube || null,
							tiktok: q.asked_by.tiktok || null,
							linkedin: q.asked_by.linkedin || null,
							twitch: q.asked_by.twitch || null,
							facebook: q.asked_by.facebook || null,
							github: q.asked_by.github || null,
							created_at: q.asked_by.created_at,
						}
					: null,
			}));

			setQuestions(formattedQuestions);
			setIsLoading(false);
		} else if (session && !session.user?.questions_received) {
			setQuestions([]);
			setIsLoading(false);
		}
	}, [session?.user?.questions_received]);

	return {
		data: questions,
		setData: setQuestions,
		isLoading,
		error: null,
	};
}

export const useLikeQuestion = () => {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation<ApiResponse, QuestionsError, LikeDislikeParams>({
		mutationFn: async ({ questionId, nickname }: LikeDislikeParams): Promise<ApiResponse> => {
			const response = await fetch("/api/question/update-like", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					questionId,
					nickname,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || "Erro ao curtir pergunta");
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["questions"] });
		},
		onError: (error: QuestionsError) => {
			toast({
				title: "Erro ao curtir pergunta!",
				description: error?.message || "Erro ao curtir pergunta",
				variant: "error",
			});
			queryClient.invalidateQueries({ queryKey: ["questions"] });
		},
	});
};

export const useDislikeQuestion = () => {
	const queryClient = useQueryClient();
	const { toast } = useToast();

	return useMutation<ApiResponse, QuestionsError, LikeDislikeParams>({
		mutationFn: async ({ questionId, nickname }: LikeDislikeParams): Promise<ApiResponse> => {
			const response = await fetch("/api/question/update-deslike", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					questionId,
					nickname,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.message || "Erro ao descurtir pergunta");
			}

			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["questions"] });
		},
		onError: (error: QuestionsError) => {
			toast({
				title: "Erro ao descurtir pergunta!",
				description: error?.message || "Erro ao descurtir pergunta",
				variant: "error",
			});
			queryClient.invalidateQueries({ queryKey: ["questions"] });
		},
	});
};

export function useAnswerQuestion() {
	const { toast } = useToast();

	return useMutation({
		mutationFn: async ({
			questionId,
			nickname,
			answerText,
		}: {
			questionId: string;
			nickname: string;
			answerText: string;
		}) => {
			const response = await fetch("/api/question/answer", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					questionId,
					nickname,
					answerText,
				}),
			});

			if (!response.ok) {
				toast({
					title: "Erro ao responder pergunta",
					variant: "error",
				});
			}

			return { questionId, answerText };
		},
		onError: (error) => {
			toast({
				title: "Erro ao responder pergunta",
				description: error instanceof Error ? error.message : "Erro ao enviar resposta",
				variant: "error",
			});
		},
		onSuccess: () => {
			toast({
				title: "Pergunta respondida com sucesso!",
				variant: "success",
			});
		},
	});
}

export function useDeclineQuestion() {
	return useMutation({
		mutationFn: async ({
			questionId,
			nickname,
		}: {
			questionId: string;
			nickname: string;
		}) => {
			const response = await fetch("/api/question/recused", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					questionId,
					nickname,
				}),
			});

			if (!response.ok) {
				throw new Error("Erro ao recusar pergunta");
			}

			return { questionId };
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Erro ao recusar pergunta");
		},
		onSuccess: () => {
			toast.success("Pergunta recusada");
		},
	});
}

export function useDeleteQuestion() {
	return useMutation({
		mutationFn: async ({
			questionId,
			nickname,
		}: {
			questionId: string;
			nickname: string;
		}) => {
			const response = await fetch("/api/question/delete", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					questionId,
					nickname,
				}),
			});

			if (!response.ok) {
				throw new Error("Erro ao deletar pergunta");
			}

			return { questionId };
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Erro ao deletar pergunta");
		},
		onSuccess: () => {
			toast.success("Pergunta deletada");
		},
	});
}

export function useReportQuestion() {
	return useMutation({
		mutationFn: async ({
			questionId,
			nickname,
			isOffensive,
			isInappropriate,
		}: {
			questionId: string;
			nickname: string;
			isOffensive: boolean;
			isInappropriate: boolean;
		}) => {
			const response = await fetch("/api/question/report-question", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					questionId,
					nickname,
					isOffensive,
					isInappropriate,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Erro ao reportar pergunta");
			}

			return { questionId, isOffensive, isInappropriate };
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Erro ao reportar pergunta");
		},
		onSuccess: () => {
			toast.success("Pergunta reportada com sucesso");
		},
	});
}

export function useMarkQuestionExpired() {
	return useMutation({
		mutationFn: async (questionId: string) => {
			const response = await fetch("/api/question/expired", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ questionId }),
			});

			if (!response.ok) {
				throw new Error("Erro ao marcar pergunta como expirada");
			}

			return { success: true };
		},
		onError: (error) => {
			console.error("Erro ao marcar pergunta como expirada:", error);
		},
	});
}
