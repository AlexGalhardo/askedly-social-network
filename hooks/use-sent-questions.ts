"use client";

import { useMutation } from "@tanstack/react-query";
import { reportAnswer, likeAnswer, dislikeAnswer, withdrawUnanswered } from "@/actions/sent-question-actions";
import { SentQuestionInterface } from "@/types/SentQuestion";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export function useSentQuestions() {
	const { data: session } = useSession();
	const [questions, setQuestions] = useState<SentQuestionInterface[]>([]);

	useEffect(() => {
		if (session?.user?.questions_sent) {
			setQuestions(
				session.user.questions_sent.map((q: any) => ({
					...q,
					owner: q.owner ?? null,
					asked_by: q.asked_by ?? null,
					total_likes: q.liked_by_users?.length || 0,
					total_dislikes: q.desliked_by_users?.length || 0,
				})),
			);
		}
	}, [session?.user?.questions_sent]);

	return {
		data: questions,
		setData: setQuestions,
		isLoading: false,
		error: null,
	};
}

export function useReportAnswer() {
	return useMutation({
		mutationFn: async ({ questionId, reason }: { questionId: string; reason: "offensive" | "inappropriate" }) => {
			await reportAnswer(questionId, reason);
			return { questionId, reason };
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Erro ao reportar resposta");
		},
		onSuccess: () => {
			toast.success("Resposta reportada com sucesso");
		},
	});
}

export function useLikeAnswer() {
	return useMutation({
		mutationFn: async ({ questionId, nickname }: { questionId: string; nickname: string }) => {
			await likeAnswer(questionId, nickname);
			return { questionId };
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Erro ao curtir resposta");
		},
	});
}

export function useDislikeAnswer() {
	return useMutation({
		mutationFn: async ({ questionId, nickname }: { questionId: string; nickname: string }) => {
			await dislikeAnswer(questionId, nickname);
			return { questionId };
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Erro ao descurtir resposta");
		},
	});
}

export function useWithdrawUnanswered() {
	return useMutation({
		mutationFn: withdrawUnanswered,
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Erro ao processar saque");
		},
		onSuccess: () => {
			toast.success("Saque solicitado com sucesso");
		},
	});
}
