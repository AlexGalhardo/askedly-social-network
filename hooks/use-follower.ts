"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { acceptFollowRequest, rejectFollowRequest, removeFollower } from "@/actions/follower-actions";
import { getMyFollowers } from "@/actions/my-account-actions";
import { useSessionBoundList } from "@/hooks/use-session-bound-list";
import { followerService } from "@/lib/services/follower-service";
import { FollowerUserInterface, FollowRequestInterface } from "@/types/FollowerUserInterface";

const loadFollowers = async (): Promise<FollowerUserInterface[]> =>
	(await getMyFollowers()) as unknown as FollowerUserInterface[];

export function useFollowers() {
	return useSessionBoundList(loadFollowers);
}

export function useFollowRequests() {
	return useQuery({
		queryKey: ["follow-requests"],
		queryFn: followerService.getFollowRequests,
		staleTime: 60 * 1000, // 1 minute
		gcTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: true,
		retry: 2,
	});
}

export function useRemoveFollower() {
	return useMutation({
		mutationFn: async ({ followerId, followerName }: { followerId: string; followerName: string }) => {
			await removeFollower(followerId);
			return { followerId, followerName };
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Erro ao remover seguidor");
		},
		onSuccess: (data) => {
			toast.success(`${data.followerName} foi removido dos seus seguidores`);
		},
	});
}

export function useAcceptFollowRequest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: acceptFollowRequest,
		onMutate: async (requestId) => {
			await queryClient.cancelQueries({ queryKey: ["follow-requests"] });

			const previousRequests = queryClient.getQueryData<FollowRequestInterface[]>(["follow-requests"]);

			queryClient.setQueryData<FollowRequestInterface[]>(
				["follow-requests"],
				(old) => old?.filter((req) => req.id !== requestId) || [],
			);

			return { previousRequests };
		},
		onError: (error, _variables, context) => {
			if (context?.previousRequests) {
				queryClient.setQueryData(["follow-requests"], context.previousRequests);
			}
			toast.error(error instanceof Error ? error.message : "Erro ao aceitar seguidor");
		},
		onSuccess: (data) => {
			toast.success("Seguidor aceito");

			if (data.senderId && data.receiverId) {
				queryClient.invalidateQueries({ queryKey: ["profile", data.senderId] });
				queryClient.invalidateQueries({ queryKey: ["profile", data.receiverId] });
			}

			queryClient.invalidateQueries({ queryKey: ["profile"] });
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
		},
	});
}

export function useRejectFollowRequest() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: rejectFollowRequest,
		onMutate: async (requestId) => {
			await queryClient.cancelQueries({ queryKey: ["follow-requests"] });

			const previousRequests = queryClient.getQueryData<FollowRequestInterface[]>(["follow-requests"]);

			queryClient.setQueryData<FollowRequestInterface[]>(
				["follow-requests"],
				(old) => old?.filter((req) => req.id !== requestId) || [],
			);

			return { previousRequests };
		},
		onError: (error, _variables, context) => {
			if (context?.previousRequests) {
				queryClient.setQueryData(["follow-requests"], context.previousRequests);
			}
			toast.error(error instanceof Error ? error.message : "Erro ao rejeitar seguidor");
		},
		onSuccess: (data) => {
			toast.success("Seguidor rejeitado");

			if (data.senderId && data.receiverId) {
				queryClient.invalidateQueries({ queryKey: ["profile", data.senderId] });
				queryClient.invalidateQueries({ queryKey: ["profile", data.receiverId] });
			}

			queryClient.invalidateQueries({ queryKey: ["profile"] });
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["follow-requests"] });
		},
	});
}
