import { FollowRequestInterface } from "@/lib/interfaces";

export const followerService = {
	async getFollowRequests(): Promise<FollowRequestInterface[]> {
		const response = await fetch("/api/user/follow-requests", {
			next: {
				tags: ["follow-requests"],
				revalidate: 60, // 1 minute
			},
		});

		if (!response.ok) {
			throw new Error("Error fetching requests");
		}

		return response.json().then((data) => data.followRequests);
	},
};
