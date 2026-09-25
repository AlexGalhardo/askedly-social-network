"use client";

import { useSession } from "next-auth/react";
import LoadingScreen from "@/components/loading-screen";
import { FeedQuestionsFeed } from "./feed/feed-questions-feed";

export default function HomePage() {
	const { data: session, status } = useSession();

	if (status === "loading") return <LoadingScreen />;

	return (
		<div className="p-4 lg:p-6">
			<div className="min-h-screen">
				<div className="container mx-auto px-3 py-4 max-w-6xl">
					<FeedQuestionsFeed
						userNickname={session?.user?.nickname ?? undefined}
						userId={session?.user?.id}
						session={session}
					/>
				</div>
			</div>
		</div>
	);
}
