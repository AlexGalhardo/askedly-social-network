"use client";

import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionInterface } from "@/lib/interfaces";
import { filterQuestionsByStatus, paginateQuestions } from "@/lib/utils/question-utils";
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
	const t = useTranslations("questions");
	const validQuestions = Array.isArray(questions) ? questions : [];

	const pendingQuestions = filterQuestionsByStatus(validQuestions, "pending");
	const answeredQuestions = filterQuestionsByStatus(validQuestions, "answered");
	const declinedQuestions = filterQuestionsByStatus(validQuestions, "declined");
	const expiredQuestions = filterQuestionsByStatus(validQuestions, "expired");
	const reportedQuestions = filterQuestionsByStatus(validQuestions, "reported");

	const renderTabContent = (
		questionsList: QuestionInterface[],
		showAnswerForm: boolean = false,
		emptyMessage: string = t("card.empty"),
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
			{/* FIX: more responsive TabList for mobile */}
			<div className="w-full overflow-x-auto">
				<TabsList className="w-full min-w-max flex h-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
					<TabsTrigger
						className="flex-1 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 min-w-0 data-[active]:bg-white dark:data-[active]:bg-gray-700"
						value="pending"
					>
						<span className="truncate">
							{t("received.tabs.pending", { count: pendingQuestions.length })}
						</span>
					</TabsTrigger>
					<TabsTrigger
						className="flex-1 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 min-w-0 data-[active]:bg-white dark:data-[active]:bg-gray-700"
						value="answered"
					>
						<span className="truncate">
							{t("received.tabs.answered", { count: answeredQuestions.length })}
						</span>
					</TabsTrigger>
					<TabsTrigger
						className="flex-1 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 min-w-0 data-[active]:bg-white dark:data-[active]:bg-gray-700"
						value="declined"
					>
						<span className="truncate">
							{t("received.tabs.declined", { count: declinedQuestions.length })}
						</span>
					</TabsTrigger>
					<TabsTrigger
						className="flex-1 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 min-w-0 data-[active]:bg-white dark:data-[active]:bg-gray-700"
						value="expired"
					>
						<span className="truncate">
							{t("received.tabs.expired", { count: expiredQuestions.length })}
						</span>
					</TabsTrigger>
					<TabsTrigger
						className="flex-1 whitespace-nowrap text-xs sm:text-sm px-2 sm:px-4 py-2 min-w-0 data-[active]:bg-white dark:data-[active]:bg-gray-700"
						value="reported"
					>
						<span className="truncate">
							{t("received.tabs.reported", { count: reportedQuestions.length })}
						</span>
					</TabsTrigger>
				</TabsList>
			</div>

			<TabsContent value="pending" className="space-y-6">
				{renderTabContent(pendingQuestions, true, t("received.empty.pending"))}
			</TabsContent>

			<TabsContent value="answered" className="space-y-6">
				{renderTabContent(answeredQuestions, false, t("received.empty.answered"))}
			</TabsContent>

			<TabsContent value="declined" className="space-y-6">
				{renderTabContent(declinedQuestions, false, t("received.empty.declined"))}
			</TabsContent>

			<TabsContent value="expired" className="space-y-6">
				{renderTabContent(expiredQuestions, false, t("received.empty.expired"))}
			</TabsContent>

			<TabsContent value="reported" className="space-y-6">
				{renderTabContent(reportedQuestions, false, t("received.empty.reported"))}
			</TabsContent>
		</Tabs>
	);
}
