"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionInterface } from "@/lib/interfaces";
import { FeedQuestionHeader } from "./feed-question-header";
import { FeedQuestionActions } from "./feed-question-actions";
import { FeedQuestionAnswer } from "./feed-question-answer";

interface QuestionCardProps {
	question: QuestionInterface;
	userNickname?: string;
	userId?: string;
	onLike: (question: QuestionInterface) => void;
	onDislike: (question: QuestionInterface) => void;
	hasUserLiked: boolean;
	hasUserDisliked: boolean;
	optimisticLikeCount?: number;
	optimisticDislikeCount?: number;
	optimisticHasUserLiked?: boolean;
	optimisticHasUserDisliked?: boolean;
}

export const FeedQuestionCard = memo(
	({
		question,
		userNickname,
		userId,
		onLike,
		onDislike,
		hasUserLiked,
		hasUserDisliked,
		optimisticLikeCount,
		optimisticDislikeCount,
		optimisticHasUserLiked,
		optimisticHasUserDisliked,
	}: QuestionCardProps) => {
		return (
			<Card className="border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
				<CardContent className="p-4 sm:p-6">
					<FeedQuestionHeader question={question} />

					<div className="mb-4">
						<h3 className="font-semibold text-base sm:text-lg text-gray-800 dark:text-gray-200 mb-2 leading-relaxed">
							<span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Perguntou</span>:{" "}
							{question.question_text}
						</h3>
					</div>

					{question.question_answered && question.answer_text && <FeedQuestionAnswer question={question} />}

					<FeedQuestionActions
						question={question}
						userNickname={userNickname}
						userId={userId}
						onLike={onLike}
						onDislike={onDislike}
						hasUserLiked={hasUserLiked}
						hasUserDisliked={hasUserDisliked}
						optimisticLikeCount={optimisticLikeCount}
						optimisticDislikeCount={optimisticDislikeCount}
						optimisticHasUserLiked={optimisticHasUserLiked}
						optimisticHasUserDisliked={optimisticHasUserDisliked}
					/>
				</CardContent>
			</Card>
		);
	},
);

FeedQuestionCard.displayName = "QuestionCard";
