"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import type { PublicQuestion } from "@/lib/repositories/questions.repository";

interface FeedQuestionActionsProps {
	question: PublicQuestion;
	userNickname?: string;
	userId?: string;
	onLike: (question: PublicQuestion) => void;
	onDislike: (question: PublicQuestion) => void;
	hasUserLiked: boolean;
	hasUserDisliked: boolean;
	optimisticLikeCount?: number;
	optimisticDislikeCount?: number;
	optimisticHasUserLiked?: boolean;
	optimisticHasUserDisliked?: boolean;
}

export const FeedQuestionActions = memo(
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
	}: FeedQuestionActionsProps) => {
		const isOwner = userId === question.owner.id;
		const canInteract = userNickname && !isOwner;

		const likeCount = optimisticLikeCount ?? JSON.parse(question.liked_by_users || "[]").length;
		const dislikeCount = optimisticDislikeCount ?? JSON.parse(question.desliked_by_users || "[]").length;
		const userLiked = optimisticHasUserLiked ?? hasUserLiked;
		const userDisliked = optimisticHasUserDisliked ?? hasUserDisliked;

		return (
			<div className="flex items-center gap-6 sm:gap-4 pt-2">
				<Button
					variant="ghost"
					size="sm"
					className={`p-2 h-auto transition-all duration-200 ${
						userLiked
							? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
							: "text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
					}`}
					disabled={!canInteract}
					onClick={() => onLike(question)}
				>
					<ThumbsUp
						className={`h-4 w-4 mr-2 transition-all duration-200 ${userLiked ? "fill-current" : ""}`}
					/>
					{question.owner.privacy_show_likes_each_answer_public && (
						<span className="text-sm font-medium">{likeCount}</span>
					)}
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className={`p-2 h-auto transition-all duration-200 ${
						userDisliked
							? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
							: "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
					}`}
					disabled={!canInteract}
					onClick={() => onDislike(question)}
				>
					<ThumbsDown
						className={`h-4 w-4 mr-2 transition-all duration-200 ${userDisliked ? "fill-current" : ""}`}
					/>
					{question.owner.privacy_show_dislikes_each_answer_public && (
						<span className="text-sm font-medium">{dislikeCount}</span>
					)}
				</Button>
			</div>
		);
	},
);

FeedQuestionActions.displayName = "QuestionActions";
