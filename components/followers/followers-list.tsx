"use client";

import { useTranslations } from "next-intl";
import { FollowerUserInterface } from "@/types/FollowerUserInterface";
import { FollowerCard } from "./follower-card";

interface FollowersListProps {
	followers: FollowerUserInterface[];
	onRemove: (followerId: string) => void;
}

export function FollowersList({ followers, onRemove }: FollowersListProps) {
	const t = useTranslations("common.followers");

	if (followers.length === 0) {
		return (
			<div className="text-center py-12 text-gray-500">
				<p className="text-base">{t("empty")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{followers.map((follower) => (
				<FollowerCard key={follower.id} follower={follower} onRemove={onRemove} />
			))}
		</div>
	);
}
