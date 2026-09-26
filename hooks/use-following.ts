"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { unfollowUser } from "@/actions/follow-actions";
import { getMyFollowing } from "@/actions/my-account-actions";
import { useSessionBoundList } from "@/hooks/use-session-bound-list";
import { FollowingUserInterface } from "@/types/FollowingUserInterface";

const loadFollowing = async (): Promise<FollowingUserInterface[]> =>
	(await getMyFollowing()) as unknown as FollowingUserInterface[];

export function useFollowing() {
	return useSessionBoundList(loadFollowing);
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
