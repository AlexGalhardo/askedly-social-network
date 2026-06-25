"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { QuestionInterface } from "@/lib/interfaces";
import { getInitials } from "@/lib/functions";

interface FeedQuestionHeaderProps {
	question: QuestionInterface;
}

export const FeedQuestionHeader = memo(({ question }: FeedQuestionHeaderProps) => {
	return (
		<div className="flex items-start gap-3 mb-4">
			<Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
				<AvatarImage src={question.asked_by.avatar_url} alt={question.asked_by.name} />
				<AvatarFallback className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
					{getInitials(question.asked_by.name)}
				</AvatarFallback>
			</Avatar>
			<div className="flex-1 min-w-0">
				<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
					<span className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
						{question.asked_by.name}
					</span>
					<Link
						href={`/${question.asked_by.nickname}`}
						className="text-sm font-bold text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 truncate"
					>
						@{question.asked_by.nickname}
					</Link>
				</div>
				<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
					{question.owner.privacy_show_value_received_from_answering_question &&
						!question.amount_paid_is_private && (
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
