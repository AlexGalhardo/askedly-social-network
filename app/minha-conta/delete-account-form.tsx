"use client";

import { Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDeleteAccount } from "@/hooks/use-account-mutations";

export function DeleteAccountForm() {
	const [isPending, startTransition] = useTransition();
	const deleteAccountMutation = useDeleteAccount();
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [accountStartDelete, setAccountStartDelete] = useState(false);

	const handleDeleteAccount = () => {
		startTransition(() => {
			deleteAccountMutation.mutate(undefined, {
				onSuccess: (data) => {
					if (!data.error) {
						setAccountStartDelete(true);
						setTimeout(() => {
							signOut({ callbackUrl: "/feed" });
						}, 10000);
					}
				},
			});
		});
	};

	const isLoading = isPending || deleteAccountMutation.isPending;

	return (
		<>
			<Card className="border-red-200">
				<CardHeader>
					<CardTitle className="mb-6">Excluir Conta</CardTitle>
					<CardDescription className="mt-6">
						Sua conta será desativada por 30 dias corridos antes de ser excluída permanentemente. Você pode
						reativar sua conta durante esse período se desejar, entrando na sua conta novamente. Após esse
						período, todos os dados relacionados à sua conta serão deletados. Não se preocupe, será aberto
						um modal para você confirmar exclusão clicando nesse botão.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						variant="destructive"
						onClick={() => setIsDeleteModalOpen(true)}
						className="w-full bg-red-600 hover:bg-red-700"
					>
						Excluir Conta
					</Button>
				</CardContent>
			</Card>

			<Dialog open={isDeleteModalOpen} onOpenChange={accountStartDelete ? () => {} : setIsDeleteModalOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-red-600">Excluir Conta</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p className="text-gray-700 leading-relaxed dark:text-white">
							{accountStartDelete
								? "Sua conta foi desativada. Se durante 30 dias, ela não for reativada novamente, todos os dados serão deletados. Você será redirecionado em 10 segundos."
								: "Sua conta será desativada por 30 dias corridos antes de ser excluída permanentemente. Você pode reativar sua conta durante esse período se desejar, entrando na sua conta novamente. Após esse período, todos os dados relacionados à sua conta serão deletados."}
						</p>

						<div className="flex gap-2 justify-end">
							{!accountStartDelete && !isLoading && (
								<Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
									Cancelar
								</Button>
							)}
							{!accountStartDelete && (
								<Button
									onClick={handleDeleteAccount}
									disabled={isLoading}
									className="bg-red-500 hover:bg-red-800 text-white"
								>
									{isLoading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Processando...
										</>
									) : (
										"Confirmar Exclusão"
									)}
								</Button>
							)}
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
