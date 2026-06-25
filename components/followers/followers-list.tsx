"use client";

import { FollowerUserInterface } from "@/types/FollowerUserInterface";
import { FollowerCard } from "./follower-card";

interface FollowersListProps {
	followers: FollowerUserInterface[];
	onRemove: (followerId: string) => void;
}

export function FollowersList({ followers, onRemove }: FollowersListProps) {
	if (followers.length === 0) {
		return (
			<div className="text-center py-12 text-gray-500">
				<p className="text-base">Você ainda não tem seguidores.</p>
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
