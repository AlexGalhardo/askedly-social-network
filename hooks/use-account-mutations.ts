"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updatePersonalInfo,
		onSuccess: (data) => {
			if (data.error) {
				toast({
					title: "Erro ao atualizar informações pessoais",
					description: data.error,
					variant: "error",
				});
				return;
			}

			toast({
				title: "Informações pessoais atualizadas com sucesso!",
				variant: "success",
			});

			queryClient.invalidateQueries({ queryKey: ["session-verification"] });
		},
		onError: (error: any) => {
			toast({
				title: "Erro ao atualizar informações pessoais",
				description: error.message || "Erro inesperado",
				variant: "error",
			});
		},
	});
}

export function useUpdateSocialMedia() {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updateSocialMedia,
		onSuccess: (data) => {
			if (data.error) {
				toast({
					title: "Erro ao atualizar redes sociais",
					description: data.error,
					variant: "error",
				});
				return;
			}

			toast({
				title: "Redes sociais atualizadas com sucesso!",
				variant: "success",
			});

			queryClient.invalidateQueries({ queryKey: ["session-verification"] });
		},
		onError: (error: any) => {
			toast({
				title: "Erro ao atualizar redes sociais",
				description: error.message || "Erro inesperado",
				variant: "error",
			});
		},
	});
}

export function useUpdatePixKey() {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updatePixKey,
		onSuccess: (data) => {
			if (data.error) {
				toast({
					title: "Erro ao atualizar chave PIX",
					description: data.error,
					variant: "error",
				});
				return;
			}

			toast({
				title: "Chave PIX atualizada com sucesso!",
				variant: "success",
			});

			queryClient.invalidateQueries({ queryKey: ["session-verification"] });
		},
		onError: (error: any) => {
			toast({
				title: "Erro ao atualizar chave PIX",
				description: error.message || "Erro inesperado",
				variant: "error",
			});
		},
	});
}

export function useUpdatePassword() {
	const { toast } = useToast();

	return useMutation({
		mutationFn: updatePassword,
		onSuccess: (data) => {
			if (data.error) {
				toast({
					title: "Erro ao atualizar senha",
					description: data.error,
					variant: "error",
				});
				return;
			}

			toast({
				title: "Sua senha foi atualizada com sucesso!",
				variant: "success",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Erro ao atualizar senha",
				description: error.message || "Erro inesperado",
				variant: "error",
			});
		},
	});
}

export function useUpdatePrivacySettings() {
	const { toast } = useToast();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: updatePrivacySettings,
		onSuccess: (data) => {
			if (data.error) {
				toast({
					title: "Erro ao atualizar configurações de privacidade",
					description: data.error,
					variant: "error",
				});
				return;
			}

			toast({
				title: "Configurações de privacidade atualizadas com sucesso!",
				variant: "success",
			});

			queryClient.invalidateQueries({ queryKey: ["session-verification"] });
		},
		onError: (error: any) => {
			toast({
				title: "Erro ao atualizar configurações de privacidade",
				description: error.message || "Erro inesperado",
				variant: "error",
			});
		},
	});
}

export function useDeleteAccount() {
	const { toast } = useToast();

	return useMutation({
		mutationFn: deleteAccount,
		onSuccess: (data) => {
			if (data.error) {
				toast({
					title: "Erro ao deletar conta",
					description: data.error,
					variant: "error",
				});
				return;
			}

			toast({
				title: "Conta foi posta em processo de exclusão.",
				description:
					"Sua conta foi desativada. Se durante 30 dias, ela não for reativada novamente, todos os dados serão deletados. Você será redirecionado em 10 segundos.",
				variant: "success",
			});
		},
		onError: (error: any) => {
			toast({
				title: "Erro ao deletar conta",
				description: error.message || "Erro inesperado",
				variant: "error",
			});
		},
	});
}
