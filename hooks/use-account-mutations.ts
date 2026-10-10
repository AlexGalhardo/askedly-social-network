"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useToast } from "@/hooks/use-toast";
import {
	deleteAccount,
	updatePassword,
	updatePersonalInfo,
	updatePixKey,
	updatePrivacySettings,
	updateSocialMedia,
} from "../actions/user-actions";

export function useUpdatePersonalInfo() {
	const { toast } = useToast();
	const t = useTranslations("account");
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updatePersonalInfo,
		onSuccess: (data) => {
			if (data.error) {
				toast({
					title: t("toasts.personalInfoError"),
					description: data.error,
					variant: "error",
				});
				return;
			}

			toast({
				title: t("toasts.personalInfoSuccess"),
				variant: "success",
			});

			queryClient.invalidateQueries({ queryKey: ["session-verification"] });
		},
		onError: (error: any) => {
			toast({
				title: t("toasts.personalInfoError"),
				description: error.message || t("toasts.unexpected"),
				variant: "error",
			});
		},
	});
}

export function useUpdateSocialMedia() {
	const { toast } = useToast();
	const t = useTranslations("account");
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateSocialMedia,
		onSuccess: (data) => {
			if (data.error) {
				toast({
					title: t("toasts.socialError"),
					description: data.error,
					variant: "error",
				});
				return;
			}

			toast({
				title: t("toasts.socialSuccess"),
				variant: "success",
			});

			queryClient.invalidateQueries({ queryKey: ["session-verification"] });
		},
		onError: (error: any) => {
			toast({
				title: t("toasts.socialError"),
				description: error.message || t("toasts.unexpected"),
				variant: "error",
			});
		},
	});
}

export function useUpdatePixKey() {
	const { toast } = useToast();
	const t = useTranslations("account");
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updatePixKey,
		onSuccess: (data) => {
			if (data.error) {
				toast({
					title: t("toasts.pixError"),
					description: data.error,
					variant: "error",
				});
				return;
			}

			toast({
				title: t("toasts.pixSuccess"),
				variant: "success",
			});

			queryClient.invalidateQueries({ queryKey: ["session-verification"] });
		},
		onError: (error: any) => {
			toast({
				title: t("toasts.pixError"),
				description: error.message || t("toasts.unexpected"),
				variant: "error",
			});
		},
	});
}

export function useUpdatePassword() {
	const { toast } = useToast();
	const t = useTranslations("account");

	return useMutation({
		mutationFn: updatePassword,
		onSuccess: (data) => {
			if (data.error) {
				toast({
					title: t("toasts.passwordError"),
					description: data.error,
					variant: "error",
				});
				return;
			}

			toast({
				title: t("toasts.passwordSuccess"),
				variant: "success",
			});
		},
		onError: (error: any) => {
			toast({
				title: t("toasts.passwordError"),
				description: error.message || t("toasts.unexpected"),
				variant: "error",
			});
		},
	});
}

export function useUpdatePrivacySettings() {
	const { toast } = useToast();
	const t = useTranslations("account");
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updatePrivacySettings,
		onSuccess: (data) => {
			if (data.error) {
				toast({
					title: t("toasts.privacyError"),
					description: data.error,
					variant: "error",
				});
				return;
			}

			toast({
				title: t("toasts.privacySuccess"),
				variant: "success",
			});

			queryClient.invalidateQueries({ queryKey: ["session-verification"] });
		},
		onError: (error: any) => {
			toast({
				title: t("toasts.privacyError"),
				description: error.message || t("toasts.unexpected"),
				variant: "error",
			});
		},
	});
}

export function useDeleteAccount() {
	const { toast } = useToast();
	const t = useTranslations("account");

	return useMutation({
		mutationFn: deleteAccount,
		onSuccess: (data) => {
			if (data.error) {
				toast({
					title: t("toasts.deleteError"),
					description: data.error,
					variant: "error",
				});
				return;
			}

			toast({
				title: t("toasts.deleteStarted"),
				description: t("delete.deactivated"),
				variant: "success",
			});
		},
		onError: (error: any) => {
			toast({
				title: t("toasts.deleteError"),
				description: error.message || t("toasts.unexpected"),
				variant: "error",
			});
		},
	});
}
