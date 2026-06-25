"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SentQuestionInterface } from "@/types/SentQuestion";
import { SentQuestionsList } from "./sent-questions-list";
import { QuestionsPagination } from "../questions-received/questions-pagination";
import { filterSentQuestionsByStatus, paginateSentQuestions } from "@/lib/utils/sent-question-utils";

interface SentQuestionsTabsProps {
	questions: SentQuestionInterface[];
	currentPage: number;
	questionsPerPage: number;
	onPageChange: (page: number) => void;
	onReport?: (questionId: string) => void;
	onLike?: (questionId: string) => void;
	onDislike?: (questionId: string) => void;
	userInteractions?: {
		[questionId: string]: { liked: boolean; disliked: boolean };
	};
	loadingStates?: {
		reporting?: string;
	};
}

export function SentQuestionsTabs({
	questions,
	currentPage,
	questionsPerPage,
	onPageChange,
	onReport,
	onLike,
	onDislike,
	userInteractions = {},
	loadingStates = {},
}: SentQuestionsTabsProps) {
	const answeredQuestions = filterSentQuestionsByStatus(questions, "answered");
	const declinedQuestions = filterSentQuestionsByStatus(questions, "declined");
	const expiredQuestions = filterSentQuestionsByStatus(questions, "expired");
	const pendingQuestions = filterSentQuestionsByStatus(questions, "pending");

	const renderTabContent = (
		questionsList: SentQuestionInterface[],
		emptyMessage: string = "Nenhuma pergunta encontrada.",
	) => {
		if (questionsList.length === 0) {
			return <div className="text-center py-12 text-gray-500">{emptyMessage}</div>;
		}

		const paginatedData = paginateSentQuestions(questionsList, currentPage, questionsPerPage);

		return (
			<>
				<SentQuestionsList
					questions={paginatedData.questions}
					onReport={onReport}
					onLike={onLike}
					onDislike={onDislike}
					userInteractions={userInteractions}
					loadingStates={loadingStates}
				/>
				<QuestionsPagination
					currentPage={currentPage}
					totalPages={paginatedData.totalPages}
					onPageChange={onPageChange}
				/>
			</>
		);
	};

	return (
		<Tabs defaultValue="answered" className="w-full" onValueChange={() => onPageChange(1)}>
			<TabsList className="grid w-full grid-cols-4">
				<TabsTrigger value="answered">Respondidas ({answeredQuestions.length})</TabsTrigger>
				<TabsTrigger value="declined">Recusadas ({declinedQuestions.length})</TabsTrigger>
				<TabsTrigger value="expired">Expiradas ({expiredQuestions.length})</TabsTrigger>
				<TabsTrigger value="pending">Aguardando ({pendingQuestions.length})</TabsTrigger>
			</TabsList>

			<TabsContent value="answered" className="space-y-6">
				{renderTabContent(answeredQuestions, "Nenhuma pergunta respondida ainda.")}
			</TabsContent>

			<TabsContent value="declined" className="space-y-6">
				{renderTabContent(declinedQuestions, "Nenhuma pergunta recusada.")}
			</TabsContent>

			<TabsContent value="expired" className="space-y-6">
				{renderTabContent(expiredQuestions, "Nenhuma pergunta expirada.")}
			</TabsContent>

			<TabsContent value="pending" className="space-y-6">
				{renderTabContent(pendingQuestions, "Nenhuma pergunta aguardando resposta.")}
			</TabsContent>
		</Tabs>
	);
}
