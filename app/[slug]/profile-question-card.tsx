// /app/[slug]/profile-question-card.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import Link from "next/link";
import { useLikeQuestion, useDislikeQuestion } from "@/hooks/use-profile-queries";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { QuestionInterface } from "@/lib/interfaces";
import { getInitials } from "@/lib/functions";
import TelegramLog from "@/lib/telegram-logger";

interface QuestionCardProps {
	question: QuestionInterface;
}

export function ProfileQuestionCard({ question }: QuestionCardProps) {
	const { data: session } = useSession();
	const { toast } = useToast();
	const likeMutation = useLikeQuestion();
	const dislikeMutation = useDislikeQuestion();

	const hasUserLiked = () => {
		if (!session?.user?.nickname) return false;
		const likedUsers = JSON.parse(question.liked_by_users || "[]");
		return likedUsers.includes(session.user.nickname);
	};

	const hasUserDisliked = () => {
		if (!session?.user?.nickname) return false;
		const dislikedUsers = JSON.parse(question.desliked_by_users || "[]");
		return dislikedUsers.includes(session.user.nickname);
	};

	const handleLike = async () => {
		if (!session?.user?.nickname) return;

		try {
			await likeMutation.mutateAsync({
				questionId: question.id,
				nickname: session.user.nickname,
			});
		} catch (error: any) {
			TelegramLog.error(`Error profile-question-card.ts handleLike: ${error?.message}`);
			toast({
				title: "Erro ao curtir pergunta!",
				description: "Tente novamente mais tarde",
				variant: "error",
			});
		}
	};

	const handleDislike = async () => {
		if (!session?.user?.nickname) return;

		try {
			await dislikeMutation.mutateAsync({
				questionId: question.id,
				nickname: session.user.nickname,
			});
		} catch (error: any) {
			TelegramLog.error(`Error profile-question-card.ts handleDislike: ${error?.message}`);
			toast({
				title: "Erro ao descurtir pergunta!",
				description: "Tente novamente mais tarde",
				variant: "error",
			});
		}
	};

	return (
		<Card className="border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
			<CardContent className="p-4 sm:p-6">
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

				<div className="mb-4">
					<h3 className="font-semibold text-base sm:text-lg text-gray-800 dark:text-gray-200 mb-2 leading-relaxed">
						<span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">Perguntou</span>:{" "}
						{question.question_text}
					</h3>
				</div>

				{question.question_answered && question.answer_text && (
					<div className="bg-green-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 border-l-4 border-green-400 dark:border-green-500 mb-4">
						<div className="flex items-start gap-2 sm:gap-3 mb-3">
							<Avatar className="h-8 w-8 flex-shrink-0">
								<AvatarImage src={question.owner.avatar_url} alt={question.owner.name} />
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
												: question.answered_at.toISOString(),
										)}
									</span>
								</div>
							</div>
						</div>
						<p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed">
							{question.answer_text}
						</p>
					</div>
				)}

				<div className="flex items-center gap-6 sm:gap-4 pt-2">
					<Button
						variant="ghost"
						size="sm"
						className={`p-2 h-auto ${
							hasUserLiked()
								? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
								: "text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
						}`}
						disabled={
							!session?.user?.nickname || session.user.id === question.owner.id || likeMutation.isPending
						}
						onClick={handleLike}
					>
						<ThumbsUp className={`h-4 w-4 mr-2 ${hasUserLiked() ? "fill-current" : ""}`} />
						{question.owner.privacy_show_likes_each_answer_public && (
							<span className="text-sm font-medium">
								{JSON.parse(question.liked_by_users || "[]").length}
							</span>
						)}
					</Button>

					<Button
						variant="ghost"
						size="sm"
						className={`p-2 h-auto ${
							hasUserDisliked()
								? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
								: "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
						}`}
						disabled={
							!session?.user?.nickname ||
							session.user.id === question.owner.id ||
							dislikeMutation.isPending
						}
						onClick={handleDislike}
					>
						<ThumbsDown className={`h-4 w-4 mr-2 ${hasUserDisliked() ? "fill-current" : ""}`} />
						{question.owner.privacy_show_dislikes_each_answer_public && (
							<span className="text-sm font-medium">
								{JSON.parse(question.desliked_by_users || "[]").length}
							</span>
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
