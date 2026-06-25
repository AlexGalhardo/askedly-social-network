"use client";

import { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useProfile } from "@/hooks/use-profile-queries";
import LoadingScreen from "@/components/loading-screen";
import { QuestionInterface } from "@/lib/interfaces";
import { ProfileHeader } from "./profile-header";
import { ProfilePagination } from "./profile-pagination";
import { ProfileQuestionCard } from "./profile-question-card";
import { ProfileQuestionForm } from "./profile-question-form";
import { ProfilePaymentModal } from "./profile-payment-modal";

const QUESTIONS_PER_PAGE = 10;

export default function ProfileClient() {
	const [currentPage, setCurrentPage] = useState(1);
	const [currentStep, setCurrentStep] = useState<"closed" | "payment" | "pix">("closed");
	const [newQuestion, setNewQuestion] = useState("");
	const [isBlocked, setIsBlocked] = useState(false);

	const router = useRouter();
	const params = useParams();
	const slug = params?.slug as string;
	const { data: session, status, update } = useSession();

	const { data: profileFound, isLoading, error } = useProfile(slug);

	useEffect(() => {
		if (session?.user?.blocked_users && profileFound) {
			const blocked = session.user.blocked_users.some(
				(block) => block.blocked.nickname === profileFound.nickname,
			);
			setIsBlocked(blocked);
		} else {
			setIsBlocked(false);
		}
	}, [session?.user?.blocked_users, profileFound]);

	const questionsData = useMemo(() => {
		if (!profileFound?.questions_received) return [];
		return profileFound.questions_received.map((q: any) => ({
			...q,
			owner: q.owner ?? profileFound,
		}));
	}, [profileFound]);

	const isFollowing = profileFound?.isFollowing ?? false;
	const hasPendingRequest = profileFound?.hasPendingRequest ?? false;

	const canViewQuestions = useMemo(() => {
		if (session?.user?.id === profileFound?.id) return true;

		if (isFollowing && session?.user?.id !== profileFound?.id) return true;

		if (
			!isFollowing &&
			profileFound?.privacy_show_questions_answered_only_to_followers &&
			session?.user?.id !== profileFound?.id
		)
			return false;

		return false;
	}, [profileFound, session?.user?.id, isFollowing]);

	const { publicQuestions, topPaidQuestions, topLikedQuestions } = useMemo(() => {
		const answered = questionsData.filter(
			(q: QuestionInterface) => q.question_answered && canViewQuestions && !q.asker_want_answer_to_be_private,
		);

		const publicQuestions = [...answered].sort(
			(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
		);

		const topPaidQuestions = [...answered].sort((a, b) => {
			const amountComparison = b.amount_paid - a.amount_paid;
			const dateComparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
			return amountComparison !== 0 ? amountComparison : dateComparison;
		});

		const topLikedQuestions = [...answered].sort((a, b) => {
			const likesA = JSON.parse(a.liked_by_users || "[]").length || 0;
			const likesB = JSON.parse(b.liked_by_users || "[]").length || 0;
			const likesComparison = likesB - likesA;
			const dateComparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
			return likesComparison !== 0 ? likesComparison : dateComparison;
		});

		return { publicQuestions, topPaidQuestions, topLikedQuestions };
	}, [questionsData, canViewQuestions]);

	const getPaginatedQuestions = (questionsList: QuestionInterface[]) => {
		const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
		const endIndex = startIndex + QUESTIONS_PER_PAGE;
		return questionsList.slice(startIndex, endIndex);
	};

	const getTotalPages = (questionsList: QuestionInterface[]) => {
		return Math.ceil(questionsList.length / QUESTIONS_PER_PAGE);
	};

	const handleSubmitQuestion = (question: string) => {
		setNewQuestion(question);
		setCurrentStep("payment");
	};

	const handleTabChange = () => {
		setCurrentPage(1);
	};

	const handleBlockSuccess = () => {
		setIsBlocked(true);
	};

	const handleUnblockSuccess = () => {
		setIsBlocked(false);
	};

	if (status === "loading" || isLoading) {
		return <LoadingScreen />;
	}

	if (error || !profileFound) {
		router.push("/");
		return null;
	}

	const wasBlockedByProfile = session?.user?.blocked_by_users?.some((block) => {
		return block.blocker_id === profileFound?.id && block.blocked_id === session?.user?.id;
	});

	if (wasBlockedByProfile) {
		router.push("/");
		return null;
	}

	const renderQuestionsList = (questions: QuestionInterface[]) => {
		if (questions.length === 0) {
			return (
				<div className="text-center py-12 text-gray-500">
					<p className="text-base">Nenhuma resposta ainda.</p>
				</div>
			);
		}

		return (
			<>
				<ProfilePagination
					currentPage={currentPage}
					totalPages={getTotalPages(questions)}
					onPageChange={setCurrentPage}
				/>
				<div className="space-y-3">
					{getPaginatedQuestions(questions).map((question) => (
						<ProfileQuestionCard key={question.id} question={question} />
					))}
				</div>
				<ProfilePagination
					currentPage={currentPage}
					totalPages={getTotalPages(questions)}
					onPageChange={setCurrentPage}
				/>
			</>
		);
	};

	return (
		<main className="p-4 lg:p-6">
			<ProfileHeader
				profile={profileFound}
				isBlocked={isBlocked}
				onBlockSuccess={handleBlockSuccess}
				onUnblockSuccess={handleUnblockSuccess}
			/>

			{!isBlocked && (
				<>
					<ProfileQuestionForm
						profile={profileFound}
						session={session}
						onSubmitQuestion={handleSubmitQuestion}
					/>

					{session?.user?.id === profileFound.id && (
						<div className="text-center py-4 rounded-lg border-2 border-blue-500 bg-blue-500 text-white shadow mb-6">
							<p className="text-sm md:text-base font-medium">Esse é seu perfil público</p>
						</div>
					)}

					{!session?.user?.id && (
						<div className="text-center py-4 rounded-lg dark:text-white mb-6 font-bold text-gray-700">
							<p className="md:text-base font-bold">
								Entre na sua conta para poder fazer perguntas a esse usuário.
							</p>
						</div>
					)}

					{canViewQuestions ? (
						<Tabs defaultValue="answered" className="w-full" onValueChange={handleTabChange}>
							<TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-neutral-800 rounded-lg p-1 h-auto">
								<TabsTrigger
									value="answered"
									className="text-xs sm:text-sm py-2.5 px-1 rounded-md text-center font-medium whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700 transition-all"
								>
									Últimas
								</TabsTrigger>
								<TabsTrigger
									value="liked"
									className="text-xs sm:text-sm py-2.5 px-1 rounded-md text-center font-medium whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700 transition-all"
								>
									Top Curtidas
								</TabsTrigger>
								<TabsTrigger
									value="top"
									className="text-xs sm:text-sm py-2.5 px-1 rounded-md text-center font-medium whitespace-nowrap data-[state=active]:bg-white dark:data-[state=active]:bg-neutral-700 transition-all"
								>
									Top Pagas
								</TabsTrigger>
							</TabsList>

							<TabsContent value="answered" className="mt-4">
								{renderQuestionsList(publicQuestions)}
							</TabsContent>

							<TabsContent value="liked" className="mt-4">
								{renderQuestionsList(topLikedQuestions)}
							</TabsContent>

							<TabsContent value="top" className="mt-4">
								{renderQuestionsList(topPaidQuestions)}
							</TabsContent>
						</Tabs>
					) : (
						<div className="text-center py-4 px-4  text-gray-700 mb-6 dark:text-white">
							<p className="text-sm md:text-base font-bold">
								{hasPendingRequest
									? "Solicitação para seguir esse perfil enviada. Aguardando aprovação."
									: "Esse perfil é privado. Você precisa ser seguidor para ver as respostas desse perfil."}
							</p>
						</div>
					)}

					<ProfilePaymentModal
						currentStep={currentStep}
						onStepChange={setCurrentStep}
						question={newQuestion}
						profile={profileFound}
						session={session}
						update={update}
					/>
				</>
			)}
		</main>
	);
}
