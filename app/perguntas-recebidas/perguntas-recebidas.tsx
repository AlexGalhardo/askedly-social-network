"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import LoadingScreen from "@/components/loading-screen";
import { ConfirmationModals } from "@/components/questions-received/question-confirmation-modals";
import { QuestionsTabs } from "@/components/questions-received/questions-tabs";
import {
	useAnswerQuestion,
	useDeclineQuestion,
	useDeleteQuestion,
	useMarkQuestionExpired,
	useReceivedQuestions,
	useReportQuestion,
} from "@/hooks/use-questions";
import { toast } from "@/hooks/use-toast";
import TelegramLog from "@/lib/telegram-logger";
import { isQuestionExpired } from "@/lib/utils/question-utils";
import { QuestionInterface } from "@/types/QuestionInterface";

export default function PerguntasRecebidasPage() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const { data: questions, setData: setQuestions, isLoading } = useReceivedQuestions();

	const answerMutation = useAnswerQuestion();
	const declineMutation = useDeclineQuestion();
	const deleteMutation = useDeleteQuestion();
	const reportMutation = useReportQuestion();

	const [currentPage, setCurrentPage] = useState(1);
	const questionsPerPage = 10;

	const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
	const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isReportModalOpen, setIsReportModalOpen] = useState(false);
	const [selectedQuestion, setSelectedQuestion] = useState<QuestionInterface | null>(null);
	const [reportReason, setReportReason] = useState("");
	const [pendingAnswer, setPendingAnswer] = useState("");

	const [loadingStates, setLoadingStates] = useState({
		answering: "",
		declining: "",
		deleting: "",
	});

	useEffect(() => {
		if (status !== "loading" && !session) {
			router.push("/entrar");
		}
	}, [session, status, router]);

	const handleAnswer = (questionId: string, answerText: string) => {
		const question = questions.find((q) => q.id === questionId);
		if (!question) return;

		setSelectedQuestion(question);
		setPendingAnswer(answerText);
		setIsAnswerModalOpen(true);
	};

	const handleConfirmAnswer = async () => {
		if (!selectedQuestion || !session?.user?.nickname) return;

		setLoadingStates((prev) => ({ ...prev, answering: selectedQuestion.id }));

		try {
			await answerMutation.mutateAsync({
				questionId: selectedQuestion.id,
				nickname: session.user.nickname,
				answerText: pendingAnswer,
			});

			setQuestions((prev) =>
				prev.map((q) =>
					q.id === selectedQuestion.id
						? {
								...q,
								question_answered: true,
								question_is_awaiting_answer: false,
								answer_text: pendingAnswer,
								answered_at: new Date(),
							}
						: q,
				),
			);
		} catch (error: any) {
			await TelegramLog.error(`Error perguntas-recebidas.ts handleConfirmAnswer: ${error?.message}`);
			toast({
				title: "Ocorreu um erro ao responder a pergunta. Por favor, tente novamente.",
				variant: "error",
			});
		} finally {
			setLoadingStates((prev) => ({ ...prev, answering: "" }));
			setIsAnswerModalOpen(false);
			setSelectedQuestion(null);
			setPendingAnswer("");
		}
	};

	const handleDecline = (questionId: string) => {
		const question = questions.find((q) => q.id === questionId);
		if (!question) return;

		setSelectedQuestion(question);
		setIsDeclineModalOpen(true);
	};

	const handleConfirmDecline = async () => {
		if (!selectedQuestion || !session?.user?.nickname) return;

		setLoadingStates((prev) => ({ ...prev, declining: selectedQuestion.id }));

		try {
			await declineMutation.mutateAsync({
				questionId: selectedQuestion.id,
				nickname: session.user.nickname,
			});

			setQuestions((prev) =>
				prev.map((q) =>
					q.id === selectedQuestion.id
						? {
								...q,
								question_answer_was_recused: true,
								question_is_awaiting_answer: false,
								updated_at: new Date(),
							}
						: q,
				),
			);
		} catch (error: any) {
			await TelegramLog.error(`Error perguntas-recebidas.ts handleConfirmDecline: ${error?.message}`);
			toast({
				title: "Ocorreu um erro ao recusar a pergunta. Por favor, tente novamente.",
				variant: "error",
			});
		} finally {
			setLoadingStates((prev) => ({ ...prev, declining: "" }));
			setIsDeclineModalOpen(false);
			setSelectedQuestion(null);
		}
	};

	const handleDelete = (questionId: string) => {
		const question = questions.find((q) => q.id === questionId);
		if (!question) return;

		setSelectedQuestion(question);
		setIsDeleteModalOpen(true);
	};

	const handleConfirmDelete = async () => {
		if (!selectedQuestion || !session?.user?.nickname) return;

		setLoadingStates((prev) => ({ ...prev, deleting: selectedQuestion.id }));

		try {
			await deleteMutation.mutateAsync({
				questionId: selectedQuestion.id,
				nickname: session.user.nickname,
			});

			setQuestions((prev) => prev.filter((q) => q.id !== selectedQuestion.id));
		} catch (error: any) {
			await TelegramLog.error(`Error perguntas-recebidas.ts handleConfirmDelete: ${error?.message}`);
			toast({
				title: "Ocorreu um erro ao deletar a pergunta. Por favor, tente novamente.",
				variant: "error",
			});
		} finally {
			setLoadingStates((prev) => ({ ...prev, deleting: "" }));
			setIsDeleteModalOpen(false);
			setSelectedQuestion(null);
		}
	};

	const handleReport = (questionId: string) => {
		const question = questions.find((q) => q.id === questionId);
		if (!question) return;

		setSelectedQuestion(question);
		setIsReportModalOpen(true);
	};

	const handleConfirmReport = async () => {
		if (!reportReason || !selectedQuestion || !session?.user?.nickname) return;

		const isOffensive = reportReason === "offensive";
		const isInappropriate = reportReason === "inappropriate";

		try {
			await reportMutation.mutateAsync({
				questionId: selectedQuestion.id,
				nickname: session.user.nickname,
				isOffensive,
				isInappropriate,
			});

			setQuestions((prev) =>
				prev.map((q) =>
					q.id === selectedQuestion.id
						? {
								...q,
								owner_reported_offensive_question: isOffensive
									? true
									: q.owner_reported_offensive_question,
								onwer_reported_inadequate_question: isInappropriate
									? true
									: q.onwer_reported_inadequate_question,
								updated_at: new Date(),
							}
						: q,
				),
			);
		} catch (error: any) {
			await TelegramLog.error(`Error perguntas-recebidas.ts handleConfirmReport: ${error?.message}`);
			toast({
				title: "Ocorreu um erro ao reportar a pergunta. Por favor, tente novamente.",
				variant: "error",
			});
		} finally {
			setIsReportModalOpen(false);
			setSelectedQuestion(null);
			setReportReason("");
		}
	};

	const markExpiredMutation = useMarkQuestionExpired();

	useEffect(() => {
		const checkExpiredQuestions = () => {
			questions.forEach((question) => {
				if (
					question.question_is_awaiting_answer &&
					!question.question_answer_was_expired &&
					isQuestionExpired(question.created_at)
				) {
					markExpiredMutation.mutate(question.id);

					setQuestions((prev) =>
						prev.map((q) =>
							q.id === question.id
								? {
										...q,
										question_answer_was_expired: true,
										question_is_awaiting_answer: false,
										question_answer_expired_at: new Date(),
									}
								: q,
						),
					);
				}
			});
		};

		const interval = setInterval(checkExpiredQuestions, 60000);

		checkExpiredQuestions();

		return () => clearInterval(interval);
	}, [questions, markExpiredMutation, setQuestions]);

	const handleQuestionExpire = useCallback(
		(questionId: string) => {
			markExpiredMutation.mutate(questionId);

			setQuestions((prev) =>
				prev.map((q) =>
					q.id === questionId
						? {
								...q,
								question_answer_was_expired: true,
								question_is_awaiting_answer: false,
								question_answer_expired_at: new Date().toISOString(),
							}
						: q,
				),
			);
		},
		[markExpiredMutation, setQuestions],
	);

	if (status === "loading" || isLoading) return <LoadingScreen />;

	if (!session) {
		router.push("/entrar");
		return null;
	}

	return (
		<main className="p-4 lg:p-6">
			<QuestionsTabs
				questions={questions}
				currentPage={currentPage}
				questionsPerPage={questionsPerPage}
				onPageChange={setCurrentPage}
				onAnswer={handleAnswer}
				onDecline={handleDecline}
				onDelete={handleDelete}
				onReport={handleReport}
				onExpire={handleQuestionExpire}
				loadingStates={{
					answering: answerMutation.isPending ? answerMutation.variables?.questionId : undefined,
					declining: declineMutation.isPending ? declineMutation.variables?.questionId : undefined,
					deleting: deleteMutation.isPending ? deleteMutation.variables?.questionId : undefined,
				}}
			/>

			<ConfirmationModals
				isAnswerModalOpen={isAnswerModalOpen}
				isDeclineModalOpen={isDeclineModalOpen}
				isDeleteModalOpen={isDeleteModalOpen}
				isReportModalOpen={isReportModalOpen}
				reportReason={reportReason}
				onAnswerModalChange={setIsAnswerModalOpen}
				onDeclineModalChange={setIsDeclineModalOpen}
				onDeleteModalChange={setIsDeleteModalOpen}
				onReportModalChange={setIsReportModalOpen}
				onReportReasonChange={setReportReason}
				onConfirmAnswer={handleConfirmAnswer}
				onConfirmDecline={handleConfirmDecline}
				onConfirmDelete={handleConfirmDelete}
				onConfirmReport={handleConfirmReport}
			/>
		</main>
	);
}
