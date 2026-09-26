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
 * Lista do usuário logado buscada por Server Action (antes vinha pronta dentro da sessão). Mantém a interface
 * `{ data, setData }` que as telas já usavam para atualização otimista.
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
