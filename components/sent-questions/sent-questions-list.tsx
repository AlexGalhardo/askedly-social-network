"use client";

import { useTranslations } from "next-intl";

import { SentQuestionInterface } from "@/types/SentQuestion";
import { SentQuestionCard } from "./sent-question-card";

interface SentQuestionsListProps {
	questions: SentQuestionInterface[];
	onReport?: (questionId: string) => void;
	loadingStates?: {
		reporting?: string;
	};
}

export function SentQuestionsList({ questions, onReport, loadingStates = {} }: SentQuestionsListProps) {
	const t = useTranslations("questions");

	if (questions.length === 0) {
		return <div className="text-center py-12 text-gray-500">{t("card.empty")}</div>;
	}

	return (
		<div className="space-y-6">
			{questions.map((question) => (
				<SentQuestionCard
					key={question.id}
					question={question}
					onReport={onReport}
					isReporting={loadingStates.reporting === question.id}
				/>
			))}
		</div>
	);
}
