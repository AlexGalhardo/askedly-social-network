"use client";

import Link from "next/link";
import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/functions";
import type { PublicQuestion } from "@/lib/repositories/questions.repository";
import { formatDate } from "@/lib/utils";

interface FeedQuestionAnswerProps {
	question: PublicQuestion;
}

export const FeedQuestionAnswer = memo(({ question }: FeedQuestionAnswerProps) => {
	if (!question.answer_text) return null;

	return (
		<div className="bg-green-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 border-l-4 border-green-400 dark:border-green-500 mb-4">
			<div className="flex items-start gap-2 sm:gap-3 mb-3">
				<Avatar className="h-8 w-8 flex-shrink-0">
					<AvatarImage src={question.owner.avatar_url ?? undefined} alt={question.owner.name} />
					<AvatarFallback className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100">
						{getInitials(question.owner.name)}
					</AvatarFallback>
				</Avatar>
				<div className="flex-1 min-w-0">
					<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
						<span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
							{question.owner.name}
						</span>
						<Link
							href={`/${question.owner.nickname}`}
							className="text-sm font-bold text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 truncate"
						>
							@{question.owner.nickname}
						</Link>
					</div>
					<div className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs text-green-600 dark:text-green-400">
						<span>respondeu</span>
						<span className="text-gray-500 dark:text-gray-400">
							{formatDate(
								typeof question.answered_at === "string"
									? question.answered_at
									: question.answered_at?.toISOString() || "",
							)}
						</span>
					</div>
				</div>
			</div>
			<p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
				{question.answer_text}
			</p>
		</div>
	);
});

FeedQuestionAnswer.displayName = "QuestionAnswer";
