import { prisma } from "@/prisma/prisma-client";

export interface FollowToggleResult {
	isFollowing: boolean;
	hasPendingRequest: boolean;
	/** Message key of the `account.follow` namespace; the caller translates. */
	message: "stoppedFollowing" | "requestCancelled" | "requestSent" | "nowFollowing";
}

/**
 * Follow/unfollow as a single button. A private profile gets a request instead of a follower. `followerId` must
 * come from the session: the caller never chooses on whose behalf to follow. Null if the target does not exist or is the user themselves.
 */
export async function toggleFollow(followerId: string, followingId: string): Promise<FollowToggleResult | null> {
	if (followerId === followingId) return null;

	const target = await prisma.user.findUnique({
		where: { id: followingId },
		select: { privacy_is_private_profile: true },
	});
	if (!target) return null;

	const pair = { followerId, followingId };
	const requestPair = { senderId: followerId, receiverId: followingId };

	if (await prisma.follower.findUnique({ where: { followerId_followingId: pair } })) {
		await prisma.follower.delete({ where: { followerId_followingId: pair } });
		return { isFollowing: false, hasPendingRequest: false, message: "stoppedFollowing" };
	}

	const pendingRequest = await prisma.followRequest.findUnique({ where: { senderId_receiverId: requestPair } });

	if (target.privacy_is_private_profile) {
		if (pendingRequest) {
			await prisma.followRequest.delete({ where: { senderId_receiverId: requestPair } });
			return { isFollowing: false, hasPendingRequest: false, message: "requestCancelled" };
		}
		await prisma.followRequest.create({ data: requestPair });
		return { isFollowing: false, hasPendingRequest: true, message: "requestSent" };
	}

	await prisma.follower.create({ data: pair });
	if (pendingRequest) await prisma.followRequest.delete({ where: { senderId_receiverId: requestPair } });
	return { isFollowing: true, hasPendingRequest: false, message: "nowFollowing" };
}
