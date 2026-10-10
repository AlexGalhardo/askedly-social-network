import { prisma } from "@/prisma/prisma-client";

export interface FollowToggleResult {
	isFollowing: boolean;
	hasPendingRequest: boolean;
	/** Chave de mensagem do namespace `account.follow`; quem chama traduz. */
	message: "stoppedFollowing" | "requestCancelled" | "requestSent" | "nowFollowing";
}

/**
 * Seguir/deixar de seguir como botão único. Perfil privado recebe solicitação em vez de seguidor. `followerId` tem
 * que vir da sessão: quem chama nunca escolhe em nome de quem segue. Null se o alvo não existe ou é o próprio usuário.
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
