"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import LoadingScreen from "@/components/loading-screen";
import { ReportModal } from "@/components/sent-questions/report-modal";
import { SentQuestionsTabs } from "@/components/sent-questions/sent-questions-tabs";
import { useReportAnswer, useSentQuestions } from "@/hooks/use-sent-questions";
import TelegramLog from "@/lib/telegram-logger";
import { SentQuestionInterface } from "@/types/SentQuestion";

export default function PerguntasEnviadasPage() {
	const router = useRouter();
	const { data: session, status } = useSession();
	const { data: questions, setData: setQuestions } = useSentQuestions();

	const reportMutation = useReportAnswer();

	const [currentPage, setCurrentPage] = useState(1);
	const questionsPerPage = 10;

	const [isReportModalOpen, setIsReportModalOpen] = useState(false);
	const [selectedQuestion, setSelectedQuestion] = useState<SentQuestionInterface | null>(null);
	const [reportReason, setReportReason] = useState("");

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

	if (status === "loading") return <LoadingScreen />;

	if (!session) {
		router.push("/entrar");
		return null;
	}

	if (questions.length === 0) {
		return (
			<div className="p-4 lg:p-6">
				<div className="text-center py-12 text-gray-500">Você ainda não enviou nenhuma pergunta.</div>
			</div>
		);
	}

	return (
		<div className="p-4 lg:p-6">
			<SentQuestionsTabs
				questions={questions}
				currentPage={currentPage}
				questionsPerPage={questionsPerPage}
				onPageChange={setCurrentPage}
				onReport={handleReport}
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
		</div>
	);
}
