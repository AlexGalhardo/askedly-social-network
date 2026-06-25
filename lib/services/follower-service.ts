import { FollowRequestInterface } from "@/types/FollowerUserInterface";

export const followerService = {
	async getFollowRequests(): Promise<FollowRequestInterface[]> {
		const response = await fetch("/api/user/follow-requests", {
			next: {
				tags: ["follow-requests"],
				revalidate: 60, // 1 minute
			},
		});

		if (!response.ok) {
			throw new Error("Erro ao buscar solicitações");
		}

		return response.json().then((data) => data.followRequests);
	},
};
