"use client";

import { CheckCircle, Clock, DollarSign, Flag, HelpCircle, Lock, Trash2, UserX, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { FaMoneyBillWave } from "react-icons/fa6";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getQuestionStatus, getTimeRemaining } from "@/lib/utils/question-utils";
import { QuestionInterface } from "@/types/QuestionInterface";

interface QuestionCardProps {
	question: QuestionInterface;
	showAnswerForm?: boolean;
	onAnswer?: (questionId: string, answerText: string) => void;
	onDecline?: (questionId: string) => void;
	onDelete?: (questionId: string) => void;
	onReport?: (questionId: string) => void;
	onExpire?: (questionId: string) => void;
	isAnswering?: boolean;
	isDeclining?: boolean;
	isDeleting?: boolean;
}

export function QuestionCard({
	question,
	showAnswerForm = false,
	onAnswer,
	onDecline,
	onDelete,
	onReport,
	onExpire,
	isAnswering = false,
	isDeclining = false,
	isDeleting = false,
}: QuestionCardProps) {
	const [answerText, setAnswerText] = useState("");
	const [timeRemaining, setTimeRemaining] = useState("");
	const [hasExpired, setHasExpired] = useState(false);
	const status = getQuestionStatus(question);

	useEffect(() => {
		if (status === "pending" && !hasExpired) {
			const interval = setInterval(() => {
				const timeData = getTimeRemaining(question.created_at.toString());

				if (typeof timeData === "object" && timeData.isExpired) {
					setHasExpired(true);
					setTimeRemaining("Expirado");
					onExpire?.(question.id);

					clearInterval(interval);
				} else if (typeof timeData === "object") {
					const { hours, minutes, seconds } = timeData;
					setTimeRemaining(`${hours}h ${minutes}m ${seconds}s restantes`);
				} else {
					setTimeRemaining(timeData);
				}
			}, 1000);

			const initialTimeData = getTimeRemaining(question.created_at.toString());
			if (typeof initialTimeData === "object" && initialTimeData.isExpired) {
				setHasExpired(true);
				setTimeRemaining("Expirado");
				onExpire?.(question.id);
			}

			return () => clearInterval(interval);
		}
	}, [question.created_at, status, hasExpired, onExpire, question.id]);

	const handleAnswer = () => {
		if (!answerText.trim() || answerText.length < 32 || answerText.length > 512) return;
		onAnswer?.(question.id, answerText);
	};

	const isAnswerValid = answerText.trim().length >= 32 && answerText.length <= 512;

	if (hasExpired && status === "pending") {
		return null;
	}

	return (
		<Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
			<CardHeader>
				<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
					<div className="flex items-center gap-3">
						{question.asker_sent_anonymous_question ? (
							<div className="flex items-center gap-2">
								<UserX className="h-5 w-5 text-gray-500 dark:text-gray-400" />
								<span className="text-sm text-gray-500 dark:text-gray-400">Pergunta Anônima</span>
							</div>
						) : (
							<div className="flex items-center gap-3">
								<Avatar className="h-10 w-10">
									<AvatarImage
										src={question.asked_by?.avatar_url || ""}
										alt={question.asked_by?.name || ""}
									/>
									<AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
										{question.asked_by?.name?.charAt(0) || "?"}
									</AvatarFallback>
								</Avatar>
								<div>
									<p className="font-semibold text-gray-900 dark:text-gray-100">
										{question.asked_by?.name}
									</p>
									<a
										className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
										href={`/${question.asked_by?.nickname}`}
									>
										@{question.asked_by?.nickname}
									</a>
								</div>
							</div>
						)}
					</div>
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
						<Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs sm:text-sm hover:bg-green-100 dark:hover:bg-green-800 border-green-200 dark:border-green-700">
							Pagou {formatCurrency(question.amount_paid)}
						</Badge>
						<span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
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
				<div className="space-y-2 mt-4">
					<div className="flex items-start gap-2 text-gray-800 dark:text-gray-200">
						<HelpCircle className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-1" />
						<p className="text-base leading-snug">
							<strong className="text-blue-600 dark:text-blue-400">Perguntou</strong>:{" "}
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

				{status === "pending" && !hasExpired && (
					<div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
						<Clock className="h-4 w-4" />
						<span className="text-sm font-medium">{timeRemaining || "Calculando..."}</span>
					</div>
				)}

				{question.answer_text && (
					<div className="bg-white dark:bg-gray-700 rounded-lg p-4 border-l-4 border-green-400 dark:border-green-500 mt-10 shadow-sm dark:shadow-gray-900/20">
						<p className="text-gray-700 dark:text-gray-200">{question.answer_text}</p>
						{question.answered_at && (
							<p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
								Você respondeu{" "}
								{formatDate(
									typeof question.answered_at === "string"
										? question.answered_at
										: question.answered_at?.toISOString() || "",
								)}
							</p>
						)}
					</div>
				)}

				{status === "answered" && question.amount_already_withdraw && (
					<div className="flex items-center gap-2 text-green-600 dark:text-green-400">
						<DollarSign className="h-4 w-4" />
						<span className="text-sm font-medium">Já Sacou</span>
					</div>
				)}

				{showAnswerForm && status === "pending" && !hasExpired && (
					<div className="space-y-3">
						<Textarea
							placeholder="Digite sua resposta aqui..."
							value={answerText}
							onChange={(e) => setAnswerText(e.target.value)}
							className="min-h-[100px] bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
						/>
						<div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
							<small>Mínimo: 32 caracteres | Máximo: 512 caracteres</small>
							<small className={answerText.length > 512 ? "text-red-500 dark:text-red-400" : ""}>
								{answerText.length}/512
							</small>
						</div>
						<div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 w-full">
							<Button
								onClick={handleAnswer}
								className="border bg-white dark:bg-gray-800 border-green-700 dark:border-green-600 text-black dark:text-gray-200 hover:bg-green-700 dark:hover:bg-green-600 hover:text-white transition-colors"
								disabled={!isAnswerValid || isAnswering}
							>
								<CheckCircle className="h-4 w-4" />
								{isAnswering ? "Respondendo..." : "Responder"}
							</Button>

							<div className="flex flex-col sm:flex-row gap-2">
								<Button
									variant="outline"
									onClick={() => onDecline?.(question.id)}
									className="border border-red-600 dark:border-red-500 bg-white dark:bg-gray-800 text-black dark:text-gray-200 hover:bg-red-600 dark:hover:bg-red-600 hover:text-white transition-colors"
									disabled={isDeclining}
								>
									<XCircle className="h-4 w-4" />
									{isDeclining ? "Recusando..." : "Não Quero Responder"}
								</Button>

								<Button
									variant="outline"
									onClick={() => onReport?.(question.id)}
									className="border border-orange-600 dark:border-orange-500 bg-white dark:bg-gray-800 text-black dark:text-gray-200 hover:bg-orange-600 dark:hover:bg-orange-600 hover:text-white transition-colors"
								>
									<Flag className="h-4 w-4 mr-1" />
									Reportar Pergunta
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* CORREÇÃO: Perguntas respondidas NÃO devem mostrar badge "Pergunta Expirada" nem botão "Deletar" */}
				{status !== "answered" && (status === "declined" || status === "expired" || status === "reported") && (
					<div className="mt-4">
						{status === "expired" && (
							<Badge
								variant="secondary"
								className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 mb-4"
							>
								Pergunta Expirada
							</Badge>
						)}
						{status === "reported" && (
							<Badge
								variant="secondary"
								className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 mb-4"
							>
								Pergunta Reportada
							</Badge>
						)}
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => onDelete?.(question.id)}
								className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 bg-white dark:bg-gray-800"
								disabled={isDeleting}
							>
								<Trash2 className="h-4 w-4 mr-1" />
								{isDeleting ? "Deletando..." : "Deletar"}
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
