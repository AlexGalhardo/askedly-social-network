"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getAnsweredPaymentDetails, getSentPaymentDetails, processWithdraw } from "@/actions/payment-actions";
import { toast } from "@/hooks/use-toast";

export function useAnsweredPaymentDetails() {
	const { data: session } = useSession();

	return useQuery({
		queryKey: ["payment-data", "answered", session?.user?.nickname],
		queryFn: async () => {
			if (!session?.user?.nickname) {
				throw new Error("Usuário não autenticado");
			}
			const result = await getAnsweredPaymentDetails(session.user.nickname);
			return result.data;
		},
		enabled: !!session?.user?.nickname,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
		refetchOnWindowFocus: true,
		refetchOnMount: true,
	});
}

export function useSentPaymentDetails() {
	const { data: session } = useSession();

	return useQuery({
		queryKey: ["payment-data", "sent", session?.user?.nickname],
		queryFn: async () => {
			if (!session?.user?.nickname) {
				throw new Error("Usuário não autenticado");
			}
			const result = await getSentPaymentDetails(session.user.nickname);
			return result.data;
		},
		enabled: !!session?.user?.nickname,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
		refetchOnWindowFocus: true,
		refetchOnMount: true,
	});
}

export function useProcessWithdraw() {
	const queryClient = useQueryClient();
	const { data: session } = useSession();

	return useMutation({
		mutationFn: processWithdraw,
		onSuccess: (data, variables) => {
			toast({
				title: "Saque realizado com sucesso",
				description: `Valor de R$ ${(variables.amount / 100).toFixed(2)} será enviado para a conta associada a essa chave PIX em breve.`,
				variant: "success",
			});

			queryClient.invalidateQueries({
				queryKey: ["payment-data", "answered", session?.user?.nickname],
			});
			queryClient.invalidateQueries({
				queryKey: ["payment-data", "sent", session?.user?.nickname],
			});
		},
		onError: (error) => {
			toast({
				title: "Erro ao realizar saque",
				description: error instanceof Error ? error.message : "Por favor, tente novamente mais tarde.",
				variant: "error",
			});
		},
	});
}
