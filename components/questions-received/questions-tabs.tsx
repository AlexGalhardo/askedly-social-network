"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { filterQuestionsByStatus, paginateQuestions } from "@/lib/utils/question-utils";
import { QuestionInterface } from "@/types/QuestionInterface";
import { QuestionsList } from "./questions-list";
import { QuestionsPagination } from "./questions-pagination";

interface QuestionsTabsProps {
	questions: QuestionInterface[];
	currentPage: number;
	questionsPerPage: number;
	onPageChange: (page: number) => void;
	onAnswer?: (questionId: string, answerText: string) => void;
	onDecline?: (questionId: string) => void;
	onDelete?: (questionId: string) => void;
	onReport?: (questionId: string) => void;
	onExpire?: (questionId: string) => void;
	loadingStates?: {
		answering?: string;
		declining?: string;
		deleting?: string;
	};
}

export function QuestionsTabs({
	questions,
	currentPage,
	questionsPerPage,
	onPageChange,
	onAnswer,
	onDecline,
	onDelete,
	onReport,
	onExpire,
	loadingStates = {},
}: QuestionsTabsProps) {
	const validQuestions = Array.isArray(questions) ? questions : [];

	const pendingQuestions = filterQuestionsByStatus(validQuestions, "pending");
	const answeredQuestions = filterQuestionsByStatus(validQuestions, "answered");
	const declinedQuestions = filterQuestionsByStatus(validQuestions, "declined");
	const expiredQuestions = filterQuestionsByStatus(validQuestions, "expired");
	const reportedQuestions = filterQuestionsByStatus(validQuestions, "reported");

	const renderTabContent = (
		questionsList: QuestionInterface[],
		showAnswerForm: boolean = false,
		emptyMessage: string = "Nenhuma pergunta encontrada.",
	) => {
		if (questionsList.length === 0) {
			return <div className="text-center py-12 text-gray-500">{emptyMessage}</div>;
		}

		const paginatedData = paginateQuestions(questionsList, currentPage, questionsPerPage);

		return (
			<>
				<QuestionsList
					questions={paginatedData.questions}
					showAnswerForm={showAnswerForm}
					onAnswer={onAnswer}
					onDecline={onDecline}
					onDelete={onDelete}
					onReport={onReport}
					onExpire={onExpire}
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
		<Tabs defaultValue="pending" className="w-full" onValueChange={() => onPageChange(1)}>
			{/* CORREÇÃO: TabList mais responsivo para mobile */}
			<div className="w-full overflow-x-auto">
				<TabsList className="w-full min-w-max flex h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
					<TabsTrigger
						className="flex-1 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 min-w-0 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
						value="pending"
					>
						<span className="truncate">Aguardando ({pendingQuestions.length})</span>
					</TabsTrigger>
					<TabsTrigger
						className="flex-1 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 min-w-0 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
						value="answered"
					>
						<span className="truncate">Respondidas ({answeredQuestions.length})</span>
					</TabsTrigger>
					<TabsTrigger
						className="flex-1 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 min-w-0 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
						value="declined"
					>
						<span className="truncate">Recusadas ({declinedQuestions.length})</span>
					</TabsTrigger>
					<TabsTrigger
						className="flex-1 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 min-w-0 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
						value="expired"
					>
						<span className="truncate">Expiradas ({expiredQuestions.length})</span>
					</TabsTrigger>
					<TabsTrigger
						className="flex-1 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 min-w-0 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
						value="reported"
					>
						<span className="truncate">Reportadas ({reportedQuestions.length})</span>
					</TabsTrigger>
				</TabsList>
			</div>

			<TabsContent value="pending" className="space-y-6">
				{renderTabContent(pendingQuestions, true, "Nenhuma pergunta pendente no momento.")}
			</TabsContent>

			<TabsContent value="answered" className="space-y-6">
				{renderTabContent(answeredQuestions, false, "Nenhuma pergunta respondida ainda.")}
			</TabsContent>

			<TabsContent value="declined" className="space-y-6">
				{renderTabContent(declinedQuestions, false, "Nenhuma pergunta recusada.")}
			</TabsContent>

			<TabsContent value="expired" className="space-y-6">
				{renderTabContent(expiredQuestions, false, "Nenhuma pergunta expirada.")}
			</TabsContent>

			<TabsContent value="reported" className="space-y-6">
				{renderTabContent(reportedQuestions, false, "Nenhuma pergunta reportada.")}
			</TabsContent>
		</Tabs>
	);
}
