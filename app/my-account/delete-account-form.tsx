"use client";

import { Loader2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDeleteAccount } from "@/hooks/use-account-mutations";

export function DeleteAccountForm() {
	const [isPending, startTransition] = useTransition();
	const t = useTranslations("account");
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
					<CardTitle className="mb-6">{t("delete.title")}</CardTitle>
					<CardDescription className="mt-6">{t("delete.description")}</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						variant="destructive"
						onClick={() => setIsDeleteModalOpen(true)}
						className="w-full bg-red-600 hover:bg-red-700"
					>
						{t("delete.title")}
					</Button>
				</CardContent>
			</Card>

			<Dialog open={isDeleteModalOpen} onOpenChange={accountStartDelete ? () => {} : setIsDeleteModalOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-red-600">{t("delete.title")}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p className="text-gray-700 leading-relaxed dark:text-white">
							{accountStartDelete ? t("delete.deactivated") : t("delete.warning")}
						</p>

						<div className="flex gap-2 justify-end">
							{!accountStartDelete && !isLoading && (
								<Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
									{t("common.cancel")}
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
											{t("common.processing")}
										</>
									) : (
										t("delete.confirm")
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
