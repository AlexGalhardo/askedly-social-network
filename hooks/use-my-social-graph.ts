"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getMySocialGraph } from "@/actions/my-account-actions";
import type { SocialGraph } from "@/lib/services/my-account.service";

const EMPTY_GRAPH: SocialGraph = {
	followingNicknames: [],
	blockedNicknames: [],
	blockedByNicknames: [],
	blockedByUserIds: [],
};

/** Who the logged-in user follows, has blocked and has been blocked by (it used to come inside the session). */
export function useMySocialGraph(): SocialGraph {
	const { data: session } = useSession();
	const userId = session?.user?.id;
	const { data } = useQuery({
		queryKey: ["my-social-graph", userId],
		queryFn: () => getMySocialGraph(),
		enabled: !!userId,
		staleTime: 60_000,
	});
	return data ?? EMPTY_GRAPH;
}
