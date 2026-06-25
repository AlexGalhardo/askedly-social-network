"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserMinus } from "lucide-react";
import { getInitials } from "@/lib/functions";
import Link from "next/link";
import { useRemoveFollower } from "@/hooks/use-follower";
import { FollowerUserInterface } from "@/types/FollowerUserInterface";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import TelegramLog from "@/lib/telegram-logger";

interface FollowerCardProps {
	follower: FollowerUserInterface;
	onRemove: (followerId: string) => void;
}

export function FollowerCard({ follower, onRemove }: FollowerCardProps) {
	const removeFollowerMutation = useRemoveFollower();
	const isMobile = useIsMobile();

	const handleRemove = async () => {
		try {
			await removeFollowerMutation.mutateAsync({
				followerId: follower.follower.id,
				followerName: follower.follower.name,
			});
			onRemove(follower.follower.id);
		} catch (error: any) {
			await TelegramLog.error(`Error follower-actions.ts ${error?.message}`);
			toast({
				title: "Erro ao remover seguidor",
				description: "Tente novamente mais tarde",
				variant: "error",
			});
		}
	};

	return (
		<Card className="border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
							<AvatarImage src={follower.follower.avatar_url || ""} alt={follower.follower.name} />
							<AvatarFallback className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
								{getInitials(follower.follower.name)}
							</AvatarFallback>
						</Avatar>
						<div>
							<p className="font-bold text-foreground">{follower.follower.name}</p>
							<Link
								href={`/${follower.follower.nickname}`}
								className="text-sm font-bold text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 truncate"
							>
								@{follower.follower.nickname}
							</Link>
						</div>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
						onClick={handleRemove}
						disabled={removeFollowerMutation.isPending}
					>
						<UserMinus className="h-4 w-4" />
						{!isMobile && (
							<span className="ml-1">
								{removeFollowerMutation.isPending ? "Removendo..." : "Remover Seguidor"}
							</span>
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
