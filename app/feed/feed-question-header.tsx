"use client";

import { memo } from "react";
import { AskerAvatar, AskerName } from "@/components/question-asker";
import { Badge } from "@/components/ui/badge";
import type { PublicQuestion } from "@/lib/repositories/questions.repository";
import { formatCurrency, formatDate } from "@/lib/utils";

interface FeedQuestionHeaderProps {
	question: PublicQuestion;
}

export const FeedQuestionHeader = memo(({ question }: FeedQuestionHeaderProps) => {
	return (
		<div className="flex items-start gap-3 mb-4">
			<AskerAvatar asker={question.asked_by} />
			<div className="flex-1 min-w-0">
				<AskerName asker={question.asked_by} />
				<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
					{/* O servidor só envia o valor quando o dono o tornou público (toPublicQuestion). */}
					{question.amount_paid !== null && (
						<>
							<Badge
								variant="secondary"
								className="text-xs w-fit bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
							>
								Pagou {formatCurrency(question.amount_paid)}
							</Badge>
							<span className="hidden sm:inline">•</span>
						</>
					)}
					<span className="text-xs">
						{formatDate(
							typeof question.created_at === "string"
								? question.created_at
								: question.created_at.toISOString(),
						)}
					</span>
				</div>
			</div>
		</div>
	);
});

FeedQuestionHeader.displayName = "QuestionHeader";
