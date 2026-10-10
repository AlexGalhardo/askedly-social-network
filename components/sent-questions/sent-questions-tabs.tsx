"use client";

import { useTranslations } from "next-intl";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { filterSentQuestionsByStatus, paginateSentQuestions } from "@/lib/utils/sent-question-utils";
import { SentQuestionInterface } from "@/types/SentQuestion";
import { QuestionsPagination } from "../questions-received/questions-pagination";
import { SentQuestionsList } from "./sent-questions-list";

interface SentQuestionsTabsProps {
	questions: SentQuestionInterface[];
	currentPage: number;
	questionsPerPage: number;
	onPageChange: (page: number) => void;
	onReport?: (questionId: string) => void;
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
	loadingStates = {},
}: SentQuestionsTabsProps) {
	const t = useTranslations("questions");
	const answeredQuestions = filterSentQuestionsByStatus(questions, "answered");
	const declinedQuestions = filterSentQuestionsByStatus(questions, "declined");
	const expiredQuestions = filterSentQuestionsByStatus(questions, "expired");
	const pendingQuestions = filterSentQuestionsByStatus(questions, "pending");

	const renderTabContent = (questionsList: SentQuestionInterface[], emptyMessage: string = t("card.empty")) => {
		if (questionsList.length === 0) {
			return <div className="text-center py-12 text-gray-500">{emptyMessage}</div>;
		}

		const paginatedData = paginateSentQuestions(questionsList, currentPage, questionsPerPage);

		return (
			<>
				<SentQuestionsList
					questions={paginatedData.questions}
					onReport={onReport}
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
				<TabsTrigger value="answered">
					{t("sent.tabs.answered", { count: answeredQuestions.length })}
				</TabsTrigger>
				<TabsTrigger value="declined">
					{t("sent.tabs.declined", { count: declinedQuestions.length })}
				</TabsTrigger>
				<TabsTrigger value="expired">{t("sent.tabs.expired", { count: expiredQuestions.length })}</TabsTrigger>
				<TabsTrigger value="pending">{t("sent.tabs.pending", { count: pendingQuestions.length })}</TabsTrigger>
			</TabsList>

			<TabsContent value="answered" className="space-y-6">
				{renderTabContent(answeredQuestions, t("sent.empty.answered"))}
			</TabsContent>

			<TabsContent value="declined" className="space-y-6">
				{renderTabContent(declinedQuestions, t("sent.empty.declined"))}
			</TabsContent>

			<TabsContent value="expired" className="space-y-6">
				{renderTabContent(expiredQuestions, t("sent.empty.expired"))}
			</TabsContent>

			<TabsContent value="pending" className="space-y-6">
				{renderTabContent(pendingQuestions, t("sent.empty.pending"))}
			</TabsContent>
		</Tabs>
	);
}
