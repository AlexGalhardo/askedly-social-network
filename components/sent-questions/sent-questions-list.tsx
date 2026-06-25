"use client";

import { SentQuestionInterface } from "@/types/SentQuestion";
import { SentQuestionCard } from "./sent-question-card";

interface SentQuestionsListProps {
	questions: SentQuestionInterface[];
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

export function SentQuestionsList({
	questions,
	onReport,
	onLike,
	onDislike,
	userInteractions = {},
	loadingStates = {},
}: SentQuestionsListProps) {
	if (questions.length === 0) {
		return <div className="text-center py-12 text-gray-500">Nenhuma pergunta encontrada.</div>;
	}

	return (
		<div className="space-y-6">
			{questions.map((question) => (
				<SentQuestionCard
					key={question.id}
					question={question}
					onReport={onReport}
					onLike={onLike}
					onDislike={onDislike}
					userInteractions={userInteractions}
					isReporting={loadingStates.reporting === question.id}
				/>
			))}
		</div>
	);
}
