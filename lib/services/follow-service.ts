import { FollowingUserInterface } from "@/types/FollowingUserInterface";

export const followService = {
	async getFollowing(): Promise<FollowingUserInterface[]> {
		const response = await fetch("/api/user/following", {
			next: {
				tags: ["following"],
				revalidate: 300, // 5 minutes
			},
		});

		if (!response.ok) {
			throw new Error("Erro ao buscar seguindo");
		}

		return response.json();
	},

	async unfollowUser(followingId: string): Promise<void> {
		const response = await fetch("/api/user/unfollow", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ followingId }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Erro ao deixar de seguir");
		}
	},
};
