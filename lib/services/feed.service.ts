import {
	getAllLatestDescPublicQuestionsAnswered,
	getFollowingQuestionsAnswered,
} from "@/lib/repositories/questions.repository";
import { prisma } from "@/prisma/prisma-client";

export type FeedType = "community" | "following";

async function getFollowingNicknames(viewerNickname: string): Promise<Set<string>> {
	const follows = await prisma.follower.findMany({
		where: { follower: { nickname: viewerNickname } },
		select: { following: { select: { nickname: true } } },
	});
	return new Set(follows.map((follow) => follow.following.nickname));
}

/**
 * Respostas públicas do feed. Perfis privados são filtrados aqui, e não no client, para que as respostas deles
 * nunca cheguem ao browser de quem não os segue.
 */
export async function getFeedQuestions(feedType: FeedType, viewerNickname: string | null) {
	if (feedType === "following") {
		return viewerNickname ? getFollowingQuestionsAnswered(viewerNickname) : [];
	}

	const questions = await getAllLatestDescPublicQuestionsAnswered();
	const hasPrivate = questions.some((question) => question.owner.privacy_is_private_profile);
	const following = hasPrivate && viewerNickname ? await getFollowingNicknames(viewerNickname) : new Set<string>();

	return questions.filter(
		(question) =>
			!question.owner.privacy_is_private_profile ||
			question.owner.nickname === viewerNickname ||
			following.has(question.owner.nickname),
	);
}
