"use client";

import { Clock, Loader, UserCheck, UserPlus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useFollowUser } from "@/hooks/use-profile-queries";
import TelegramLog from "@/lib/telegram-logger";
import { QuestionInterface } from "@/types/QuestionInterface";
import { ProfileBlockUserButton } from "./profile-block-user-button";
import { ProfileSocialLinks } from "./profile-social-linkts";

interface ProfileHeaderProps {
	profile: any;
	isBlocked?: boolean;
	onBlockSuccess?: () => void;
	onUnblockSuccess?: () => void;
}

export function ProfileHeader({ profile, isBlocked = false, onBlockSuccess, onUnblockSuccess }: ProfileHeaderProps) {
	const { data: session } = useSession();
	const { toast } = useToast();
	const followMutation = useFollowUser() as ReturnType<typeof useFollowUser>;

	const [localIsFollowing, setLocalIsFollowing] = useState(profile.isFollowing || false);
	const [localHasPendingRequest, setLocalHasPendingRequest] = useState(profile.hasPendingRequest || false);
	const [localIsBlocked, setLocalIsBlocked] = useState(isBlocked);

	useEffect(() => {
		setLocalIsFollowing(profile.isFollowing || false);
		setLocalHasPendingRequest(profile.hasPendingRequest || false);
	}, [profile.isFollowing, profile.hasPendingRequest]);

	useEffect(() => {
		setLocalIsBlocked(isBlocked);
	}, [isBlocked]);

	const handleFollow = async () => {
		if (!session?.user?.id) {
			toast({
				title: "Login necessário",
				description: "Você precisa estar logado para seguir usuários",
				variant: "error",
			});
			return;
		}

		try {
			const result = await followMutation.mutateAsync({
				followingId: profile.id,
				followerId: session.user.id,
			});

			if (result.error) {
				toast({
					title: "Erro",
					description: result.error,
					variant: "error",
				});
				return;
			}

			setLocalIsFollowing(result.isFollowing ?? false);
			setLocalHasPendingRequest(result.hasPendingRequest ?? false);

			toast({
				title: result.message,
				variant: "default",
			});
		} catch (error: any) {
			await TelegramLog.error(`Catch Error file profile-header.ts handleFollow: ${error?.message}`);
			toast({
				title: `Erro ao seguir @${profile?.nickname}`,
				description: "Tente novamente mais tarde",
				variant: "error",
			});
		}
	};

	const handleBlockSuccess = () => {
		setLocalIsBlocked(true);
		onBlockSuccess?.();
	};

	const handleUnblockSuccess = () => {
		setLocalIsBlocked(false);
		onUnblockSuccess?.();
	};

	const getFollowButtonContent = () => {
		if (followMutation.isPending) {
			return (
				<>
					<Loader className="h-4 w-4 animate-spin" />
					Carregando...
				</>
			);
		}

		if (localIsFollowing) {
			return (
				<>
					<UserCheck className="h-4 w-4" />
					Seguindo
				</>
			);
		}

		if (localHasPendingRequest) {
			return (
				<>
					<Clock className="h-4 w-4" />
					Solicitado
				</>
			);
		}

		return (
			<>
				<UserPlus className="h-4 w-4" />
				Seguir
			</>
		);
	};

	const getFollowButtonVariant = () => {
		if (localIsFollowing) return "secondary";
		if (localHasPendingRequest) return "outline";
		return "default";
	};

	const shouldShowActionButtons = !session?.user?.id || session.user.id !== profile.id;

	return (
		<Card className="mb-6 shadow">
			<CardContent className="p-4 sm:p-6">
				<div className="flex flex-col items-center text-center">
					<Avatar className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 rounded shadow">
						<AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.name} />
						<AvatarFallback className="text-2xl sm:text-3xl bg-gradient-to-r from-green-700 to-green-600 text-white rounded-2xl">
							{profile.name.charAt(0)}
						</AvatarFallback>
					</Avatar>

					<h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 mt-4 dark:text-white">
						{profile.name}
					</h1>
					<h2 className="text-orange-600 dark:text-gray-300 text-lg sm:text-xl font-bold mb-2 break-all">
						@{profile.nickname}
					</h2>

					<p className="text-muted-foreground mb-3 max-w-xs sm:max-w-md text-sm dark:text-gray-400">
						{profile.description}
					</p>

					{profile.website && (
						<a
							href={profile.website}
							className="text-blue-600 dark:text-white hover:underline mb-4 break-words text-sm sm:text-base"
							target="_blank"
							rel="noopener noreferrer"
						>
							{profile.website}
						</a>
					)}

					<ProfileSocialLinks profile={profile} />

					{shouldShowActionButtons && (
						<div className="flex flex-wrap justify-center items-center gap-2 mb-5">
							{!localIsBlocked && (
								<Button
									variant={getFollowButtonVariant()}
									onClick={handleFollow}
									disabled={followMutation.isPending || !session}
									className="px-3 py-1 text-sm font-medium flex items-center gap-1"
									title={!session ? "Faça login para seguir usuários" : ""}
								>
									{getFollowButtonContent()}
								</Button>
							)}

							{session?.user && (
								<ProfileBlockUserButton
									sessionUser={{
										id: session.user.id,
										nickname: session.user.nickname ?? "",
									}}
									profileFound={{
										id: profile.id,
										nickname: profile.nickname ?? "",
									}}
									onBlockSuccess={handleBlockSuccess}
									onUnblockSuccess={handleUnblockSuccess}
								/>
							)}
						</div>
					)}

					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 w-full max-w-2xl">
						{profile.privacy_show_total_questions_answered_public && (
							<div className="text-center">
								<div className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">
									{profile.questions_received?.filter((q: any) => q.question_answered).length || 0}
								</div>
								<div className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
									respondidas
								</div>
							</div>
						)}

						{profile.privacy_show_total_questions_received_public && (
							<div className="text-center">
								<div className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">
									{profile.questions_received?.length || 0}
								</div>
								<div className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
									recebidas
								</div>
							</div>
						)}

						{profile.privacy_show_total_questions_sent_public && (
							<div className="text-center">
								<div className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">
									{profile.questions_sent?.length || 0}
								</div>
								<div className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
									enviadas
								</div>
							</div>
						)}

						{profile.privacy_show_total_followers_public && (
							<div className="text-center">
								<div className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">
									{profile.followers?.length || 0}
								</div>
								<div className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
									seguidores
								</div>
							</div>
						)}

						{profile.privacy_show_total_followers_public && (
							<div className="text-center">
								<div className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">
									{profile.following?.length || 0}
								</div>
								<div className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400">
									seguindo
								</div>
							</div>
						)}

						{profile.privacy_show_total_likes_all_answers_public && (
							<div className="text-center">
								<div className="text-2xl sm:text-3xl font-bold text-foreground dark:text-white">
									{profile.questions_received
										?.filter((q: QuestionInterface) => q.question_answered)
										.reduce(
											(acc: number, q: QuestionInterface) =>
												acc + (JSON.parse(q.liked_by_users || "[]").length || 0),
											0,
										) || 0}
								</div>
								<div className="text-xs sm:text-sm text-muted-foreground dark:text-gray-400">Likes</div>
							</div>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
