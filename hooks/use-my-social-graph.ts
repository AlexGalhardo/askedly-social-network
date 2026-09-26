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

/** Quem o usuário logado segue, bloqueou e por quem foi bloqueado (antes vinha dentro da sessão). */
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
