"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { FollowingUserInterface } from "@/lib/interfaces";
import { FollowingUserCard } from "./following-user-card";

interface FollowingListProps {
	following: FollowingUserInterface[];
	onUnfollow: (followingId: string) => void;
}

export function FollowingList({ following, onUnfollow }: FollowingListProps) {
	const t = useTranslations("common.following");

	if (following.length === 0) {
		return (
			<Card className="mx-4 lg:mx-0">
				<CardContent className="p-6 sm:p-8 text-center">
					<p className="text-muted-foreground text-sm sm:text-base">{t("empty")}</p>
					<p className="text-xs sm:text-sm text-muted-foreground mt-2">{t("emptyHint")}</p>
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
