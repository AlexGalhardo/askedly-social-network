"use client";

import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { toast } from "sonner";
import { getMySentQuestions } from "@/actions/my-account-actions";
import { reportAnswer } from "@/actions/sent-question-actions";
import { useSessionBoundList } from "@/hooks/use-session-bound-list";
import { SentQuestionInterface } from "@/lib/interfaces";

const loadSentQuestions = async (): Promise<SentQuestionInterface[]> =>
	(await getMySentQuestions()).map((q) => ({
		...q,
		owner: q.owner ?? null,
		asked_by: q.asked_by ?? null,
		total_likes: q.liked_by_users?.length || 0,
		total_dislikes: q.desliked_by_users?.length || 0,
	})) as unknown as SentQuestionInterface[];

export function useSentQuestions() {
	return useSessionBoundList(loadSentQuestions);
}

export function useReportAnswer() {
	const t = useTranslations("questions");

	return useMutation({
		mutationFn: async ({ questionId, reason }: { questionId: string; reason: "offensive" | "inappropriate" }) => {
			await reportAnswer(questionId, reason);
			return { questionId, reason };
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : t("toasts.reportAnswerFailed"));
		},
		onSuccess: () => {
			toast.success(t("toasts.answerReported"));
		},
	});
}
