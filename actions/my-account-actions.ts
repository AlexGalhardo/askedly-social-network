"use server";

import {
	countPendingQuestions,
	getMyBlockedUsers as loadBlockedUsers,
	getMyFollowers as loadFollowers,
	getMyFollowing as loadFollowing,
	getMyReceivedQuestions as loadReceivedQuestions,
	getMySentQuestions as loadSentQuestions,
	getMySocialGraph as loadSocialGraph,
	type SocialGraph,
} from "@/lib/services/my-account.service";
import { getSessionUser } from "@/lib/session";

// Cada tela busca só o que usa, com a identidade da sessão. Sem sessão, lista vazia (a tela já redireciona).

export async function getMyPendingQuestionsCount(): Promise<number> {
	const user = await getSessionUser();
	return user ? countPendingQuestions(user.nickname) : 0;
}

export async function getMyReceivedQuestions() {
	const user = await getSessionUser();
	return user ? loadReceivedQuestions(user.nickname) : [];
}

export async function getMySentQuestions() {
	const user = await getSessionUser();
	return user ? loadSentQuestions(user.nickname) : [];
}

export async function getMyFollowers() {
	const user = await getSessionUser();
	return user ? loadFollowers(user.id) : [];
}

export async function getMyFollowing() {
	const user = await getSessionUser();
	return user ? loadFollowing(user.id) : [];
}

export async function getMyBlockedUsers() {
	const user = await getSessionUser();
	return user ? loadBlockedUsers(user.id) : [];
}

const EMPTY_GRAPH: SocialGraph = {
	followingNicknames: [],
	blockedNicknames: [],
	blockedByNicknames: [],
	blockedByUserIds: [],
};

export async function getMySocialGraph(): Promise<SocialGraph> {
	const user = await getSessionUser();
	return user ? loadSocialGraph(user.id) : EMPTY_GRAPH;
}
