"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import LoadingScreen from "@/components/loading-screen";
import { ReportModal } from "@/components/sent-questions/report-modal";
import { SentQuestionsTabs } from "@/components/sent-questions/sent-questions-tabs";
import { useDislikeAnswer, useLikeAnswer, useReportAnswer, useSentQuestions } from "@/hooks/use-sent-questions";
import TelegramLog from "@/lib/telegram-logger";
import { SentQuestionInterface } from "@/types/SentQuestion";

export default function PerguntasEnviadasPage() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const { data: questions, setData: setQuestions } = useSentQuestions();

	const reportMutation = useReportAnswer();
	const likeMutation = useLikeAnswer();
	const dislikeMutation = useDislikeAnswer();

	const [currentPage, setCurrentPage] = useState(1);
	const questionsPerPage = 10;

	// Modal states
	const [isReportModalOpen, setIsReportModalOpen] = useState(false);
	const [selectedQuestion, setSelectedQuestion] = useState<SentQuestionInterface | null>(null);
	const [reportReason, setReportReason] = useState("");

	// User interactions state
	const [userInteractions, setUserInteractions] = useState<{
		[questionId: string]: { liked: boolean; disliked: boolean };
	}>({});

	// Loading states
	const [loadingStates, setLoadingStates] = useState({
		reporting: "",
	});

	useEffect(() => {
		if (status !== "loading" && !session) {
			router.push("/entrar");
		}
	}, [session, status, router]);

	const handleReport = (questionId: string) => {
		const question = questions.find((q) => q.id === questionId);
		if (!question) return;

		setSelectedQuestion(question);
		setIsReportModalOpen(true);
	};

	const handleConfirmReport = async () => {
		if (!reportReason || !selectedQuestion) return;

		setLoadingStates((prev) => ({ ...prev, reporting: selectedQuestion.id }));

		try {
			await reportMutation.mutateAsync({
				questionId: selectedQuestion.id,
				reason: reportReason as "offensive" | "inappropriate",
			});

			setQuestions((prev) =>
				prev.map((q) =>
					q.id === selectedQuestion.id
						? {
								...q,
								asker_reported_answer: true,
								asker_reported_answer_reason: reportReason,
								asker_reported_answer_at: new Date(),
								updated_at: new Date(),
							}
						: q,
				),
			);
		} catch (error: any) {
			await TelegramLog.error(`Error perguntas-enviadas.ts handleConfirmReport: ${error?.message}`);
		} finally {
			setLoadingStates((prev) => ({ ...prev, reporting: "" }));
			setIsReportModalOpen(false);
			setSelectedQuestion(null);
			setReportReason("");
		}
	};

	const handleLike = async (questionId: string) => {
		if (!session?.user?.nickname) return;

		const currentInteraction = userInteractions[questionId] || { liked: false, disliked: false };
		const wasLiked = currentInteraction.liked;
		const wasDisliked = currentInteraction.disliked;

		// Update local state immediately for responsiveness
		setUserInteractions((prev) => ({
			...prev,
			[questionId]: {
				liked: !wasLiked,
				disliked: false,
			},
		}));

		setQuestions((prev) =>
			prev.map((q) => {
				if (q.id === questionId) {
					return {
						...q,
						total_likes: wasLiked ? (q.total_likes || 0) - 1 : (q.total_likes || 0) + 1,
						total_dislikes: wasDisliked ? (q.total_dislikes || 0) - 1 : q.total_dislikes || 0,
					};
				}
				return q;
			}),
		);

		try {
			await likeMutation.mutateAsync({ questionId });
		} catch (error: any) {
			await TelegramLog.error(`Error perguntas-enviadas.ts handleLike: ${error?.message}`);
			setUserInteractions((prev) => ({
				...prev,
				[questionId]: currentInteraction,
			}));

			setQuestions((prev) =>
				prev.map((q) => {
					if (q.id === questionId) {
						return {
							...q,
							total_likes: q.total_likes,
							total_dislikes: q.total_dislikes,
						};
					}
					return q;
				}),
			);
		}
	};

	const handleDislike = async (questionId: string) => {
		if (!session?.user?.nickname) return;

		const currentInteraction = userInteractions[questionId] || { liked: false, disliked: false };
		const wasLiked = currentInteraction.liked;
		const wasDisliked = currentInteraction.disliked;

		// Update local state immediately for responsiveness
		setUserInteractions((prev) => ({
			...prev,
			[questionId]: {
				liked: false,
				disliked: !wasDisliked,
			},
		}));

		setQuestions((prev) =>
			prev.map((q) => {
				if (q.id === questionId) {
					return {
						...q,
						total_likes: wasLiked ? (q.total_likes || 0) - 1 : q.total_likes || 0,
						total_dislikes: wasDisliked ? (q.total_dislikes || 0) - 1 : (q.total_dislikes || 0) + 1,
					};
				}
				return q;
			}),
		);

		try {
			await dislikeMutation.mutateAsync({ questionId });
		} catch (error: any) {
			await TelegramLog.error(`Error perguntas-enviadas.ts handleDislike: ${error?.message}`);
			setUserInteractions((prev) => ({
				...prev,
				[questionId]: currentInteraction,
			}));

			setQuestions((prev) =>
				prev.map((q) => {
					if (q.id === questionId) {
						return {
							...q,
							total_likes: q.total_likes,
							total_dislikes: q.total_dislikes,
						};
					}
					return q;
				}),
			);
		}
	};

	if (status === "loading") return <LoadingScreen />;

	if (!session) {
		router.push("/entrar");
		return null;
	}

	if (questions.length === 0) {
		return (
			<main className="p-4 lg:p-6">
				<div className="text-center py-12 text-gray-500">Você ainda não enviou nenhuma pergunta.</div>
			</main>
		);
	}

	return (
		<main className="p-4 lg:p-6">
			<SentQuestionsTabs
				questions={questions}
				currentPage={currentPage}
				questionsPerPage={questionsPerPage}
				onPageChange={setCurrentPage}
				onReport={handleReport}
				onLike={handleLike}
				onDislike={handleDislike}
				userInteractions={userInteractions}
				loadingStates={loadingStates}
			/>

			<ReportModal
				isOpen={isReportModalOpen}
				onOpenChange={setIsReportModalOpen}
				reportReason={reportReason}
				onReportReasonChange={setReportReason}
				onConfirmReport={handleConfirmReport}
				isReporting={loadingStates.reporting !== ""}
			/>
		</main>
	);
}
