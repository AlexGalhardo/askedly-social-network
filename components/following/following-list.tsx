"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FollowingUserInterface } from "@/types/FollowingUserInterface";
import { FollowingUserCard } from "./following-user-card";
import { useIsMobile } from "@/hooks/use-mobile";

interface FollowingListProps {
	following: FollowingUserInterface[];
	onUnfollow: (followingId: string) => void;
}

export function FollowingList({ following, onUnfollow }: FollowingListProps) {
	if (following.length === 0) {
		return (
			<Card className="mx-4 lg:mx-0">
				<CardContent className="p-6 sm:p-8 text-center">
					<p className="text-muted-foreground text-sm sm:text-base">Você não está seguindo ninguém ainda.</p>
					<p className="text-xs sm:text-sm text-muted-foreground mt-2">
						Comece a seguir pessoas para ver suas atividades no seu feed!
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-3 px-4 lg:px-0">
			{following.map((user) => (
				<FollowingUserCard key={user.id} user={user} onUnfollow={onUnfollow} />
			))}
		</div>
	);
}
