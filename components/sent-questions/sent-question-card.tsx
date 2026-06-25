"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SentQuestionInterface } from "@/types/SentQuestion";
import { getSentQuestionStatus } from "@/lib/utils/sent-question-utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getInitials } from "@/lib/functions";
import { UserX, Flag, HelpCircle, Lock, Heart, ThumbsDown } from "lucide-react";
import { FaMoneyBillWave } from "react-icons/fa6";
import Link from "next/link";

interface SentQuestionCardProps {
	question: SentQuestionInterface;
	onReport?: (questionId: string) => void;
	onLike?: (questionId: string) => void;
	onDislike?: (questionId: string) => void;
	userInteractions?: {
		[questionId: string]: { liked: boolean; disliked: boolean };
	};
	isReporting?: boolean;
}

export function SentQuestionCard({
	question,
	onReport,
	onLike,
	onDislike,
	userInteractions = {},
	isReporting = false,
}: SentQuestionCardProps) {
	const status = getSentQuestionStatus(question);
	const interaction = userInteractions[question.id] || { liked: false, disliked: false };

	const getStatusBadge = () => {
		switch (status) {
			case "answered":
				return <Badge className="bg-green-100 text-green-700">Respondida</Badge>;
			case "declined":
				return <Badge className="bg-red-100 text-red-700">Recusada</Badge>;
			case "expired":
				return <Badge className="bg-gray-100 text-gray-700">Expirada</Badge>;
			case "pending":
				return <Badge className="bg-yellow-100 text-yellow-700">Aguardando</Badge>;
			default:
				return <Badge className="bg-yellow-100 text-yellow-700">Aguardando</Badge>;
		}
	};

	return (
		<Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
			<CardHeader>
				<div className="flex justify-between items-start">
					<div className="flex items-center gap-2">
						<Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800 border-green-200 dark:border-green-700">
							Você Pagou {formatCurrency(question.amount_paid)}
						</Badge>
						<span className="text-gray-500 dark:text-gray-400">
							{" "}
							{formatDate(
								typeof question.created_at === "string"
									? question.created_at
									: question.created_at.toISOString(),
							)}
						</span>
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				<div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
					{question.asker_sent_anonymous_question && (
						<>
							<UserX className="h-4 w-4" />
							<span>Enviada anonimamente</span>
							<span>•</span>
						</>
					)}
				</div>

				<div className="space-y-2">
					<div className="flex items-start gap-2 text-gray-800 dark:text-gray-200">
						<HelpCircle className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-1" />
						<p className="text-lg leading-snug">
							<strong className="text-blue-600 dark:text-blue-400">Você Perguntou</strong>:{" "}
							{question.question_text}
						</p>
					</div>

					{question.asker_want_answer_to_be_private && (
						<div className="flex items-start gap-2 text-gray-800 dark:text-gray-200">
							<Lock className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mt-1" />
							<p className="text-base leading-snug">
								<strong className="text-yellow-600 dark:text-yellow-400">
									Essa Resposta É Privada
								</strong>
							</p>
						</div>
					)}

					{question.amount_paid_is_private && (
						<div className="flex items-start gap-2 text-gray-800 dark:text-gray-200">
							<FaMoneyBillWave className="w-5 h-5 text-green-600 dark:text-green-400 mt-1" />
							<p className="text-base leading-snug">
								<strong className="text-green-600 dark:text-green-400">
									O valor pago por essa pergunta será privado
								</strong>
							</p>
						</div>
					)}
				</div>

				{/* Resposta */}
				{question.answer_text && status === "answered" && (
					<>
						<div className="flex items-start gap-2 sm:gap-3 mb-3">
							<Avatar className="h-8 w-8 flex-shrink-0">
								<AvatarImage src={question.owner.avatar_url || ""} alt={question.owner.name} />
								<AvatarFallback className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
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
										className="text-sm font-bold text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 truncate transition-colors"
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
								<div className="rounded bg-green-50 dark:bg-green-900/20 px-6 py-6 mt-6 mb-3 border border-green-200 dark:border-green-800">
									<p className="text-gray-700 dark:text-gray-200">{question.answer_text}</p>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onReport?.(question.id)}
								className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
								disabled={isReporting}
							>
								<Flag className="h-4 w-4 mr-1" />
								{isReporting ? "Reportando..." : "Reportar resposta"}
							</Button>
						</div>
					</>
				)}

				{/* Status para perguntas não respondidas */}
				{status !== "answered" && (
					<div className="flex items-start gap-2 sm:gap-3 mb-3">
						<Avatar className="h-8 w-8 flex-shrink-0">
							<AvatarImage src={question.owner.avatar_url || ""} alt={question.owner.name} />
							<AvatarFallback className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
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
									className="text-sm font-bold text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 truncate transition-colors"
								>
									@{question.owner.nickname}
								</Link>
							</div>
							<div className="mt-4">{getStatusBadge()}</div>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
