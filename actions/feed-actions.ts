"use server";

import { type FeedType, getFeedQuestions as getFeedQuestionsForViewer } from "@/lib/services/feed.service";
import { getSessionUser } from "@/lib/session";

export async function getFeedQuestions(feedType: FeedType) {
	const viewer = await getSessionUser();
	return getFeedQuestionsForViewer(feedType === "following" ? "following" : "community", viewer?.nickname ?? null);
}
