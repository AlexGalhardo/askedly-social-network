import { publicUserSelect } from "@/lib/repositories/users.repository";
import { hideAnonymousAsker } from "@/lib/utils/question-privacy";
import { markExpiredQuestions, QUESTION_ANSWER_WINDOW_HOURS } from "@/lib/utils/question-utils";
import { prisma } from "@/prisma/prisma-client";

// The user's own account data, fetched per screen (it all used to go inside the NextAuth session on every read).
// Every function receives the session identity; never call it with an id/nickname coming from the client.

const questionUsers = { owner: { select: publicUserSelect }, asked_by: { select: publicUserSelect } } as const;

export async function countPendingQuestions(nickname: string): Promise<number> {
	return prisma.question.count({
		where: {
			owner_user_nickname: nickname,
			question_is_awaiting_answer: true,
			question_answered: false,
			question_answer_was_expired: false,
			created_at: { gt: new Date(Date.now() - QUESTION_ANSWER_WINDOW_HOURS * 60 * 60 * 1000) },
		},
	});
}

export async function getMyReceivedQuestions(nickname: string) {
	const questions = await prisma.question.findMany({
		where: { owner_user_nickname: nickname },
		include: questionUsers,
		orderBy: { created_at: "desc" },
	});
	// Not even the question owner sees who sent an anonymous one.
	return markExpiredQuestions(questions).map(hideAnonymousAsker);
}

export async function getMySentQuestions(nickname: string) {
	const questions = await prisma.question.findMany({
		where: { asked_by_user_nickname: nickname },
		include: questionUsers,
		orderBy: { created_at: "desc" },
	});
	return markExpiredQuestions(questions);
}

export async function getMyFollowers(userId: string) {
	return prisma.follower.findMany({
		where: { followingId: userId },
		include: { follower: { select: publicUserSelect } },
		orderBy: { created_at: "desc" },
	});
}

export async function getMyFollowing(userId: string) {
	return prisma.follower.findMany({
		where: { followerId: userId },
		include: { following: { select: publicUserSelect } },
		orderBy: { created_at: "desc" },
	});
}

export async function getMyBlockedUsers(userId: string) {
	return prisma.userBlock.findMany({
		where: { blocker_id: userId },
		include: { blocked: { select: { id: true, name: true, nickname: true, avatar_url: true } } },
		orderBy: { created_at: "desc" },
	});
}

export interface SocialGraph {
	followingNicknames: string[];
	blockedNicknames: string[];
	blockedByNicknames: string[];
	blockedByUserIds: string[];
}

/** What feed and profile need to filter: who I follow, who I blocked and who blocked me. */
export async function getMySocialGraph(userId: string): Promise<SocialGraph> {
	const [following, blocked, blockedBy] = await Promise.all([
		prisma.follower.findMany({
			where: { followerId: userId },
			select: { following: { select: { nickname: true } } },
		}),
		prisma.userBlock.findMany({
			where: { blocker_id: userId },
			select: { blocked: { select: { nickname: true } } },
		}),
		prisma.userBlock.findMany({
			where: { blocked_id: userId },
			select: { blocker: { select: { id: true, nickname: true } } },
		}),
	]);
	return {
		followingNicknames: following.map((f) => f.following.nickname),
		blockedNicknames: blocked.map((b) => b.blocked.nickname),
		blockedByNicknames: blockedBy.map((b) => b.blocker.nickname),
		blockedByUserIds: blockedBy.map((b) => b.blocker.id),
	};
}
