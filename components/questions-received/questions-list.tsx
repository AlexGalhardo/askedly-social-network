"use client";

import { useTranslations } from "next-intl";

import { QuestionInterface } from "@/types/QuestionInterface";
import { QuestionCard } from "./question-card";

interface QuestionsListProps {
	questions: QuestionInterface[];
	showAnswerForm?: boolean;
	onAnswer?: (questionId: string, answerText: string) => void;
	onDecline?: (questionId: string) => void;
	onDelete?: (questionId: string) => void;
	onReport?: (questionId: string) => void;
	onExpire?: (questionId: string) => void; // NEW
	loadingStates?: {
		answering?: string;
		declining?: string;
		deleting?: string;
	};
}

export function QuestionsList({
	questions,
	showAnswerForm = false,
	onAnswer,
	onDecline,
	onDelete,
	onReport,
	onExpire, // NEW
	loadingStates = {},
}: QuestionsListProps) {
	const t = useTranslations("questions");

	if (!Array.isArray(questions) || questions.length === 0) {
		return <div className="text-center py-12 text-gray-500 dark:text-gray-400">{t("card.empty")}</div>;
	}

	return (
		<div className="space-y-6">
			{questions.map((question) => (
				<QuestionCard
					key={question.id}
					question={question}
					showAnswerForm={showAnswerForm}
					onAnswer={onAnswer}
					onDecline={onDecline}
					onDelete={onDelete}
					onReport={onReport}
					onExpire={onExpire} // NEW
					isAnswering={loadingStates.answering === question.id}
					isDeclining={loadingStates.declining === question.id}
					isDeleting={loadingStates.deleting === question.id}
				/>
			))}
		</div>
	);
}
