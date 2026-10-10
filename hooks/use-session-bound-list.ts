"use client";

import { useSession } from "next-auth/react";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

export interface SessionBoundList<T> {
	data: T[];
	setData: Dispatch<SetStateAction<T[]>>;
	isLoading: boolean;
	error: null;
}

/**
 * List of the logged-in user fetched by Server Action (it used to come ready inside the session). Keeps the
 * `{ data, setData }` interface the screens already used for optimistic updates.
 */
export function useSessionBoundList<T>(load: () => Promise<T[]>): SessionBoundList<T> {
	const { data: session, status } = useSession();
	const userId = session?.user?.id;
	const [data, setData] = useState<T[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (status === "loading") return;
		if (!userId) {
			setData([]);
			setIsLoading(false);
			return;
		}
		let cancelled = false;
		setIsLoading(true);
		load()
			.then((rows) => {
				if (!cancelled) setData(rows);
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [load, userId, status]);

	return { data, setData, isLoading, error: null };
}
