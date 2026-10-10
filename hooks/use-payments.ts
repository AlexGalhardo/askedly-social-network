"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useFormatter, useTranslations } from "next-intl";
import { getAnsweredPaymentDetails, getSentPaymentDetails, processWithdraw } from "@/actions/payment-actions";
import { toast } from "@/hooks/use-toast";

export function useAnsweredPaymentDetails() {
	const te = useTranslations("errors");
	const { data: session } = useSession();

	return useQuery({
		queryKey: ["payment-data", "answered", session?.user?.nickname],
		queryFn: async () => {
			if (!session?.user?.nickname) {
				throw new Error(te("unauthorized"));
			}
			const result = await getAnsweredPaymentDetails();
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
	const te = useTranslations("errors");
	const { data: session } = useSession();

	return useQuery({
		queryKey: ["payment-data", "sent", session?.user?.nickname],
		queryFn: async () => {
			if (!session?.user?.nickname) {
				throw new Error(te("unauthorized"));
			}
			const result = await getSentPaymentDetails();
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
	const t = useTranslations("payments");
	const format = useFormatter();
	const queryClient = useQueryClient();
	const { data: session } = useSession();

	return useMutation({
		mutationFn: processWithdraw,
		onSuccess: (data) => {
			toast({
				title: t("withdraw.successTitle"),
				description: t("withdraw.successDescription", {
					amount: format.number(data.amount / 100, { style: "currency", currency: "BRL" }),
				}),
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
				title: t("withdraw.errorTitle"),
				description: error instanceof Error ? error.message : t("withdraw.errorFallback"),
				variant: "error",
			});
		},
	});
}
