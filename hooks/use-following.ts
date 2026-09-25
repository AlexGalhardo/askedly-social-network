"use client";

import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { unfollowUser } from "@/actions/follow-actions";
import { FollowingUserInterface } from "@/types/FollowingUserInterface";

export function useFollowing() {
	const { data: session } = useSession();
	const [following, setFollowing] = useState<FollowingUserInterface[]>([]);

	useEffect(() => {
		if (session?.user?.following) {
			setFollowing(session.user.following);
		}
	}, [session?.user?.following]);

	return {
		data: following,
		setData: setFollowing,
		isLoading: false,
		error: null,
	};
}

export function useUnfollowUser() {
	return useMutation({
		mutationFn: async ({ followingId, userName }: { followingId: string; userName: string }) => {
			await unfollowUser(followingId);
			return { followingId, userName };
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Erro ao deixar de seguir");
		},
		onSuccess: (data) => {
			toast.success(`Você deixou de seguir ${data.userName}`);
		},
	});
}
