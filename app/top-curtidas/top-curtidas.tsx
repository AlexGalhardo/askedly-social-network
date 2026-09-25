"use client";

import { Loader2, ThumbsDown, ThumbsUp, Trophy } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import LoadingScreen from "@/components/loading-screen";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useDislikeQuestion, useLikeQuestion } from "@/hooks/use-profile-queries";
import { getInitials } from "@/lib/functions";
import { QuestionInterface } from "@/lib/interfaces";
import TelegramLog from "@/lib/telegram-logger";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TopCurtidasProps {
	today: QuestionInterface[];
	week: QuestionInterface[];
	month: QuestionInterface[];
	year: QuestionInterface[];
	allTime: QuestionInterface[];
}

export default function TopCurtidasClient({ today, week, month, year, allTime }: TopCurtidasProps) {
	const { data: session } = useSession();
	const { toast } = useToast();
	const likeMutation = useLikeQuestion();
	const dislikeMutation = useDislikeQuestion();
	const { status } = useSession();
	const [activeTab, setActiveTab] = useState("today");
	const [displayedQuestions, setDisplayedQuestions] = useState<QuestionInterface[]>([]);
	const [currentData, setCurrentData] = useState<QuestionInterface[]>([]);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMoreQuestions, setHasMoreQuestions] = useState(true);

	const [todayQuestions, setTodayQuestions] = useState<QuestionInterface[]>(today);
	const [weekQuestions, setWeekQuestions] = useState<QuestionInterface[]>(week);
	const [monthQuestions, setMonthQuestions] = useState<QuestionInterface[]>(month);
	const [yearQuestions, setYearQuestions] = useState<QuestionInterface[]>(year);
	const [allTimeQuestions, setAllTimeQuestions] = useState<QuestionInterface[]>(allTime);

	const questionsPerLoad = 10;

	const sortQuestionsByLikes = (questions: QuestionInterface[]) => {
		return questions.sort((a, b) => {
			const likesA = JSON.parse(a.liked_by_users || "[]").length;
			const likesB = JSON.parse(b.liked_by_users || "[]").length;
			return likesB - likesA;
		});
	};

	const updateQuestionInAllStates = (updatedQuestion: QuestionInterface) => {
		const updateQuestion = (questions: QuestionInterface[]) =>
			questions.map((q) => (q.id === updatedQuestion.id ? updatedQuestion : q));

		setTodayQuestions((prev) => updateQuestion(prev));
		setWeekQuestions((prev) => updateQuestion(prev));
		setMonthQuestions((prev) => updateQuestion(prev));
		setYearQuestions((prev) => updateQuestion(prev));
		setAllTimeQuestions((prev) => updateQuestion(prev));
	};

	useEffect(() => {
		let newData: QuestionInterface[] = [];

		switch (activeTab) {
			case "today":
				newData = sortQuestionsByLikes([...todayQuestions]);
				break;
			case "week":
				newData = sortQuestionsByLikes([...weekQuestions]);
				break;
			case "month":
				newData = sortQuestionsByLikes([...monthQuestions]);
				break;
			case "year":
				newData = sortQuestionsByLikes([...yearQuestions]);
				break;
			case "allTime":
				newData = sortQuestionsByLikes([...allTimeQuestions]);
				break;
		}

		setCurrentData(newData);
		const initialQuestions = newData.slice(0, questionsPerLoad);
		setDisplayedQuestions(initialQuestions);
		setHasMoreQuestions(newData.length > questionsPerLoad);
	}, [activeTab, todayQuestions, weekQuestions, monthQuestions, yearQuestions, allTimeQuestions]);

	const loadMoreQuestions = useCallback(() => {
		if (isLoadingMore || !hasMoreQuestions) return;

		setIsLoadingMore(true);

		setTimeout(() => {
			const currentLength = displayedQuestions.length;
			const nextQuestions = currentData.slice(currentLength, currentLength + questionsPerLoad);

			if (nextQuestions.length > 0) {
				setDisplayedQuestions((prev) => [...prev, ...nextQuestions]);
				setHasMoreQuestions(currentLength + nextQuestions.length < currentData.length);
			} else {
				setHasMoreQuestions(false);
			}

			setIsLoadingMore(false);
		}, 500);
	}, [displayedQuestions.length, currentData, isLoadingMore, hasMoreQuestions]);

	useEffect(() => {
		const handleScroll = () => {
			const scrollTop = window.scrollY;
			const windowHeight = window.innerHeight;
			const documentHeight = document.documentElement.scrollHeight;

			if (scrollTop + windowHeight >= documentHeight - 200) {
				loadMoreQuestions();
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [loadMoreQuestions]);

	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);

		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	const hasUserLiked = (question: QuestionInterface) => {
		if (!session?.user?.nickname) return false;
		const likedUsers = JSON.parse(question.liked_by_users || "[]");
		return likedUsers.includes(session.user.nickname);
	};

	const hasUserDisliked = (question: QuestionInterface) => {
		if (!session?.user?.nickname) return false;
		const dislikedUsers = JSON.parse(question.desliked_by_users || "[]");
		return dislikedUsers.includes(session.user.nickname);
	};

	const handleLike = async (question: QuestionInterface) => {
		if (!session?.user?.nickname) return;

		try {
			await likeMutation.mutateAsync({
				questionId: question.id,
				nickname: session.user.nickname,
			});

			const currentLikedUsers = JSON.parse(question.liked_by_users || "[]");
			const currentDislikedUsers = JSON.parse(question.desliked_by_users || "[]");
			const userNickname = session.user.nickname;

			let updatedLikedUsers = [...currentLikedUsers];
			let updatedDislikedUsers = [...currentDislikedUsers];

			if (currentLikedUsers.includes(userNickname)) {
				updatedLikedUsers = updatedLikedUsers.filter((nick) => nick !== userNickname);
			} else {
				updatedLikedUsers.push(userNickname);
				updatedDislikedUsers = updatedDislikedUsers.filter((nick) => nick !== userNickname);
			}

			const updatedQuestion = {
				...question,
				liked_by_users: JSON.stringify(updatedLikedUsers),
				desliked_by_users: JSON.stringify(updatedDislikedUsers),
			};

			updateQuestionInAllStates(updatedQuestion);
		} catch (error: any) {
			toast({
				title: "Erro ao curtir pergunta!",
				description: "Tente novamente mais tarde",
				variant: "error",
			});
		}
	};

	const handleDislike = async (question: QuestionInterface) => {
		if (!session?.user?.nickname) return;

		try {
			await dislikeMutation.mutateAsync({
				questionId: question.id,
				nickname: session.user.nickname,
			});

			const currentLikedUsers = JSON.parse(question.liked_by_users || "[]");
			const currentDislikedUsers = JSON.parse(question.desliked_by_users || "[]");
			const userNickname = session.user.nickname;

			let updatedLikedUsers = [...currentLikedUsers];
			let updatedDislikedUsers = [...currentDislikedUsers];

			if (currentDislikedUsers.includes(userNickname)) {
				updatedDislikedUsers = updatedDislikedUsers.filter((nick) => nick !== userNickname);
			} else {
				updatedDislikedUsers.push(userNickname);
				updatedLikedUsers = updatedLikedUsers.filter((nick) => nick !== userNickname);
			}

			const updatedQuestion = {
				...question,
				liked_by_users: JSON.stringify(updatedLikedUsers),
				desliked_by_users: JSON.stringify(updatedDislikedUsers),
			};

			updateQuestionInAllStates(updatedQuestion);
		} catch (error: any) {
			await TelegramLog.error(`Erro ao descurtir pergunta ${error?.message}`);
			toast({
				title: "Erro ao descurtir pergunta!",
				description: "Tente novamente mais tarde",
				variant: "error",
			});
		}
	};

	if (status === "loading") return <LoadingScreen />;

	const renderQuestionCard = (question: QuestionInterface, index: number) => (
		<Card key={question.id} className="border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
			<CardContent className="p-4 sm:p-6">
				<div className="flex items-start gap-3 mb-4">
					<Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
						<AvatarImage src={question?.asked_by?.avatar_url as string} alt={question.asked_by.name} />
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
								<AvatarImage src={question.owner.avatar_url as string} alt={question.owner.name} />
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
											typeof question?.answered_at === "string"
												? question?.answered_at
												: question?.answered_at
													? question.answered_at.toISOString()
													: "",
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
							hasUserLiked(question)
								? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
								: "text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20"
						}`}
						disabled={
							!session?.user?.nickname || session.user.id === question.owner.id || likeMutation.isPending
						}
						onClick={() => handleLike(question)}
					>
						<ThumbsUp className={`h-4 w-4 mr-2 ${hasUserLiked(question) ? "fill-current" : ""}`} />
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
							hasUserDisliked(question)
								? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30"
								: "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
						}`}
						disabled={
							!session?.user?.nickname ||
							session.user.id === question.owner.id ||
							dislikeMutation.isPending
						}
						onClick={() => handleDislike(question)}
					>
						<ThumbsDown className={`h-4 w-4 mr-2 ${hasUserDisliked(question) ? "fill-current" : ""}`} />
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

	const renderEmptyState = (period: string) => (
		<div className="text-center py-12">
			<Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
			<p className="text-gray-500 text-lg">Nenhuma pergunta curtida {period} ainda.</p>
			<p className="text-gray-400 text-sm mt-2">Seja o primeiro a curtir uma resposta!</p>
		</div>
	);

	const renderTabContent = (period: string) => (
		<div className="space-y-4 sm:space-y-6">
			{displayedQuestions.map((question, index) => renderQuestionCard(question, index))}

			{isLoadingMore && (
				<div className="flex justify-center items-center py-8">
					<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
					<span className="ml-2 text-gray-500">Carregando mais respostas...</span>
				</div>
			)}

			{!hasMoreQuestions && displayedQuestions.length > 0 && (
				<div className="text-center py-8">
					<p className="text-gray-500 text-sm">Você chegou ao final da lista! 🎉</p>
				</div>
			)}

			{displayedQuestions.length === 0 && !isLoadingMore && renderEmptyState(period)}
		</div>
	);

	return (
		<main className="p-4 lg:p-6">
			<div className="mb-6 text-center mt-12">
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2 dark:text-white">
					<Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 dark:text-yellow-400" />
					TOP 10 Respostas Mais Curtidas
				</h1>
				<p className="text-gray-600 mt-8 mb-12 dark:text-white">
					Veja as 10 perguntas e respostas mais curtidas da comunidade
				</p>
			</div>

			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-5 mb-6">
					<TabsTrigger value="today" className="text-xs sm:text-sm">
						Hoje
					</TabsTrigger>
					<TabsTrigger value="week" className="text-xs sm:text-sm">
						Semana
					</TabsTrigger>
					<TabsTrigger value="month" className="text-xs sm:text-sm">
						Mês
					</TabsTrigger>
					<TabsTrigger value="year" className="text-xs sm:text-sm">
						Ano {new Date().getFullYear()}
					</TabsTrigger>
					<TabsTrigger value="allTime" className="text-xs sm:text-sm">
						Geral
					</TabsTrigger>
				</TabsList>

				<TabsContent value="today">{renderTabContent("hoje")}</TabsContent>

				<TabsContent value="week">{renderTabContent("esta semana")}</TabsContent>

				<TabsContent value="month">{renderTabContent("este mês")}</TabsContent>

				<TabsContent value="year">{renderTabContent("este ano")}</TabsContent>

				<TabsContent value="allTime">{renderTabContent("de todos os tempos")}</TabsContent>
			</Tabs>
		</main>
	);
}
