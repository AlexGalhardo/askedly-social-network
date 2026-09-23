"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { type FeedType, useDislikeQuestion, useLikeQuestion, useQuestions } from "@/hooks/use-questions";
import { QuestionInterface } from "@/lib/interfaces";
import { FeedQuestionCard } from "./feed-question-card";
import { FeedTabs } from "./feed-tabs";

interface FeedQuestionsFeedProps {
	userNickname?: string;
	userId?: string;
	session?: any;
}

interface FeedOptimisticState {
	[questionId: string]: {
		likeCount: number;
		dislikeCount: number;
		hasUserLiked: boolean;
		hasUserDisliked: boolean;
		timestamp: number;
	};
}

export const FeedQuestionsFeed = ({ userNickname, userId, session }: FeedQuestionsFeedProps) => {
	const [activeTab, setActiveTab] = useState<FeedType>("community");
	const [optimisticStates, setOptimisticStates] = useState<FeedOptimisticState>({});

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useQuestions(
		activeTab,
		userNickname,
	);

	const likeQuestionMutation = useLikeQuestion();
	const dislikeQuestionMutation = useDislikeQuestion();

	const blockedNicknames = useMemo(() => {
		const blockedByUser = session?.user?.blocked_users?.map((block: any) => block.blocked.nickname) || [];
		const blockedByOthers = session?.user?.blocked_by_users?.map((block: any) => block.blocked.nickname) || [];
		const allBlocked = [...blockedByUser, ...blockedByOthers];

		return allBlocked;
	}, [session?.user?.blocked_users, session?.user?.blocked_by_users]);

	const questions = useMemo(() => {
		const allQuestions =
			(data?.pages as { questions: QuestionInterface[] }[] | undefined)?.flatMap((page) => page.questions) || [];

		let filteredQuestions = allQuestions;

		filteredQuestions = filteredQuestions.filter((question) => {
			if (question.owner.privacy_is_private_profile === true) {
				const isOwner = userNickname === question.owner.nickname;
				const isFollowing = session?.user?.following?.some(
					(follow: any) => follow.following.nickname === question.owner.nickname,
				);

				return isOwner || isFollowing;
			}
			return true;
		});

		if (userNickname && blockedNicknames.length > 0) {
			filteredQuestions = filteredQuestions.filter((question) => {
				const isOwnerBlocked = blockedNicknames.includes(question.owner.nickname);
				const isAskerBlocked = blockedNicknames.includes(question.asked_by.nickname);

				return !isOwnerBlocked && !isAskerBlocked;
			});
		}

		return filteredQuestions;
	}, [data, userNickname, blockedNicknames]);

	const hasUserLiked = useCallback(
		(question: QuestionInterface) => {
			if (!userNickname) return false;
			const likedUsers = JSON.parse(question.liked_by_users || "[]");
			return likedUsers.includes(userNickname);
		},
		[userNickname],
	);

	const hasUserDisliked = useCallback(
		(question: QuestionInterface) => {
			if (!userNickname) return false;
			const dislikedUsers = JSON.parse(question.desliked_by_users || "[]");
			return dislikedUsers.includes(userNickname);
		},
		[userNickname],
	);

	useEffect(() => {
		const interval = setInterval(() => {
			const now = Date.now();
			setOptimisticStates((prev) => {
				const newState = { ...prev };
				let hasChanges = false;

				Object.keys(newState).forEach((questionId) => {
					if (now - newState[questionId].timestamp > 5000) {
						delete newState[questionId];
						hasChanges = true;
					}
				});

				return hasChanges ? newState : prev;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	const handleLike = useCallback(
		(question: QuestionInterface) => {
			if (!userNickname) return;

			const currentLiked = hasUserLiked(question);
			const currentDisliked = hasUserDisliked(question);
			const currentLikeCount = JSON.parse(question.liked_by_users || "[]").length;
			const currentDislikeCount = JSON.parse(question.desliked_by_users || "[]").length;

			setOptimisticStates((prev) => ({
				...prev,
				[question.id]: {
					likeCount: currentLiked ? currentLikeCount - 1 : currentLikeCount + 1,
					dislikeCount: currentDisliked ? currentDislikeCount - 1 : currentDislikeCount,
					hasUserLiked: !currentLiked,
					hasUserDisliked: false,
					timestamp: Date.now(),
				},
			}));

			likeQuestionMutation.mutate(
				{
					questionId: question.id,
					nickname: userNickname,
				},
				{
					onError: () => {
						setOptimisticStates((prev) => {
							const newState = { ...prev };
							delete newState[question.id];
							return newState;
						});
					},
				},
			);
		},
		[userNickname, likeQuestionMutation, hasUserLiked, hasUserDisliked],
	);

	const handleDislike = useCallback(
		(question: QuestionInterface) => {
			if (!userNickname) return;

			const currentLiked = hasUserLiked(question);
			const currentDisliked = hasUserDisliked(question);
			const currentLikeCount = JSON.parse(question.liked_by_users || "[]").length;
			const currentDislikeCount = JSON.parse(question.desliked_by_users || "[]").length;

			setOptimisticStates((prev) => ({
				...prev,
				[question.id]: {
					likeCount: currentLiked ? currentLikeCount - 1 : currentLikeCount,
					dislikeCount: currentDisliked ? currentDislikeCount - 1 : currentDislikeCount + 1,
					hasUserLiked: false,
					hasUserDisliked: !currentDisliked,
					timestamp: Date.now(),
				},
			}));

			dislikeQuestionMutation.mutate(
				{
					questionId: question.id,
					nickname: userNickname,
				},
				{
					onError: () => {
						setOptimisticStates((prev) => {
							const newState = { ...prev };
							delete newState[question.id];
							return newState;
						});
					},
				},
			);
		},
		[userNickname, dislikeQuestionMutation, hasUserLiked, hasUserDisliked],
	);

	const handleTabChange = useCallback((tab: FeedType) => {
		setActiveTab(tab);
		setOptimisticStates({});
	}, []);

	useEffect(() => {
		const handleScroll = () => {
			const scrollTop = window.scrollY;
			const windowHeight = window.innerHeight;
			const documentHeight = document.documentElement.scrollHeight;

			if (scrollTop + windowHeight >= documentHeight - 200 && hasNextPage && !isFetchingNextPage) {
				fetchNextPage();
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [fetchNextPage, hasNextPage, isFetchingNextPage]);

	if (isLoading) {
		return (
			<div className="space-y-4 sm:space-y-6">
				<div className="bg-white dark:bg-gray-900 pb-4 border-b border-gray-200 dark:border-gray-700">
					<FeedTabs activeTab={activeTab} onTabChange={handleTabChange} isLoggedIn={!!userNickname} />
				</div>
				<div className="flex justify-center items-center py-12">
					<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
					<span className="ml-2 text-gray-500">Carregando...</span>
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="space-y-4 sm:space-y-6">
				<div className="bg-white dark:bg-gray-900 pb-4 border-b border-gray-200 dark:border-gray-700">
					<FeedTabs activeTab={activeTab} onTabChange={handleTabChange} isLoggedIn={!!userNickname} />
				</div>
				<div className="text-center py-12">
					<p className="text-red-500 text-lg">
						Erro ao carregar perguntas: {error?.message || "Erro desconhecido"}
					</p>
				</div>
			</div>
		);
	}

	if (questions.length === 0) {
		return (
			<div className="space-y-4 sm:space-y-6">
				<div className=" bg-white dark:bg-gray-900 pb-4 border-b border-gray-200 dark:border-gray-700">
					<FeedTabs activeTab={activeTab} onTabChange={handleTabChange} isLoggedIn={!!userNickname} />
				</div>
				<div className="text-center py-12">
					{activeTab === "following" ? (
						<p className="text-gray-500 text-lg">
							Você ainda não segue ninguém ou as pessoas que você segue não têm perguntas respondidas.
						</p>
					) : (
						<p className="text-gray-500 text-lg">Nenhuma pergunta encontrada no momento.</p>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			<div className=" bg-white dark:bg-gray-900">
				<FeedTabs activeTab={activeTab} onTabChange={handleTabChange} isLoggedIn={!!userNickname} />
			</div>

			<div className="min-h-[400px]">
				{questions.map((question) => {
					const optimisticState = optimisticStates[question.id];

					return (
						<div key={question.id} className="mb-4 sm:mb-6">
							<FeedQuestionCard
								question={question}
								userNickname={userNickname}
								userId={userId}
								onLike={handleLike}
								onDislike={handleDislike}
								hasUserLiked={hasUserLiked(question)}
								hasUserDisliked={hasUserDisliked(question)}
								optimisticLikeCount={optimisticState?.likeCount}
								optimisticDislikeCount={optimisticState?.dislikeCount}
								optimisticHasUserLiked={optimisticState?.hasUserLiked}
								optimisticHasUserDisliked={optimisticState?.hasUserDisliked}
							/>
						</div>
					);
				})}
			</div>

			{isFetchingNextPage && (
				<div className="flex justify-center items-center py-8">
					<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
					<span className="ml-2 text-gray-500">Carregando mais respostas...</span>
				</div>
			)}

			{!hasNextPage && questions.length > 0 && (
				<div className="text-center py-8">
					<p className="text-gray-500 text-sm">Você chegou ao final do feed! 🎉</p>
				</div>
			)}
		</div>
	);
};
