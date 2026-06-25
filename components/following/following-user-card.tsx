"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserMinus } from "lucide-react";
import { useUnfollowUser } from "@/hooks/use-following";
import { FollowingUserInterface } from "@/types/FollowingUserInterface";
import { getInitials } from "@/lib/functions";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import TelegramLog from "@/lib/telegram-logger";

interface UserCardProps {
	user: FollowingUserInterface;
	onUnfollow: (followingId: string) => void;
}

export function FollowingUserCard({ user, onUnfollow }: UserCardProps) {
	const unfollowMutation = useUnfollowUser();
	const isMobile = useIsMobile();

	const handleUnfollow = async () => {
		try {
			await unfollowMutation.mutateAsync({
				followingId: user.following.id,
				userName: user.following.name,
			});
			onUnfollow(user.following.id);
		} catch (error: any) {
			await TelegramLog.error(`Catch Error file following-user-card.ts handle unfollow: ${error?.message}`);
			toast({
				title: "Erro ao deixar de seguir",
				description: "Tente novamente mais tarde",
				variant: "error",
			});
		}
	};

	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<Avatar className="h-12 w-12">
							{user.following.avatar_url && (
								<AvatarImage src={user.following.avatar_url} alt={user.following.name} />
							)}
							<AvatarFallback className="bg-muted text-foreground font-bold">
								{getInitials(user.following.name)}
							</AvatarFallback>
						</Avatar>
						<div className="flex-1">
							<p className="font-bold text-foreground">{user.following.name}</p>
							<a
								href={`/${user.following.nickname}`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 text-sm underline hover:text-blue-800 transition-colors"
							>
								@{user.following.nickname}
							</a>
						</div>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
						onClick={handleUnfollow}
						disabled={unfollowMutation.isPending}
					>
						<UserMinus className="h-4 w-4" />
						{!isMobile && (
							<span className="ml-1">
								{unfollowMutation.isPending ? "Deixando..." : "Deixar de Seguir"}
							</span>
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
