"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "./use-toast";

interface SessionUserInterface {
	id: string;
	nickname: string;
	pix_key?: string;
}

interface VerifiedSession {
	user: SessionUserInterface;
	expires: string;
}

export function useSessionVerification() {
	const { data: nextAuthSession, status: nextAuthStatus } = useSession();

	const {
		data: verifiedSession,
		isLoading: isVerifying,
		error,
		refetch,
	} = useQuery({
		queryKey: ["session-verification", nextAuthSession?.user?.id],
		queryFn: async (): Promise<VerifiedSession | null> => {
			if (!nextAuthSession?.user?.id) return null;

			const response = await fetch("/api/auth/verify-session", {
				method: "GET",
				credentials: "include",
			});

			if (!response.ok) {
				if (response.status === 401) return null;
				toast({
					title: "Erro ao verificar sessão",
					variant: "error",
				});
			}

			return response.json();
		},
		enabled: !!nextAuthSession?.user?.id && nextAuthStatus === "authenticated",
		staleTime: 5 * 60 * 1000, // 5 minutos
		gcTime: 10 * 60 * 1000, // 10 minutos
		retry: (failureCount, error: any) => {
			if (error?.message?.includes("401")) return false;
			return failureCount < 2;
		},
	});

	const isAuthenticated = !!verifiedSession && nextAuthStatus === "authenticated";
	const isLoading = nextAuthStatus === "loading" || isVerifying;

	return {
		session: verifiedSession,
		isAuthenticated,
		isLoading,
		error,
		refetch,
	};
}
