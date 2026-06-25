"use client";

import { useState, useEffect } from "react";
import { UserX, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import TelegramLog from "@/lib/telegram-logger";

interface BlockUserButtonProps {
	sessionUser: {
		id: string;
		nickname: string;
	} | null;
	profileFound: {
		id: string;
		nickname: string;
	};
	onBlockSuccess?: () => void;
	onUnblockSuccess?: () => void;
}

export function ProfileBlockUserButton({
	sessionUser,
	profileFound,
	onBlockSuccess,
	onUnblockSuccess,
}: BlockUserButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [isBlocked, setIsBlocked] = useState(false);
	const [checkingBlockStatus, setCheckingBlockStatus] = useState(!!sessionUser);

	useEffect(() => {
		if (!sessionUser) {
			setCheckingBlockStatus(false);
			setIsBlocked(false);
			return;
		}

		const checkBlockStatus = async () => {
			try {
				const response = await fetch(`/api/user/block-status?targetNickname=${profileFound.nickname}`);
				if (response.ok) {
					const data = await response.json();
					setIsBlocked(data.isBlocked);
				} else {
					setIsBlocked(false);
				}
			} catch (error: any) {
				await TelegramLog.error(`Catch Error profile-block-user-button.ts checkBlockStatus: ${error?.message}`);
				setIsBlocked(false);
			} finally {
				setCheckingBlockStatus(false);
			}
		};

		checkBlockStatus();
	}, [profileFound.nickname, sessionUser]);

	const handleBlockAction = async () => {
		if (!sessionUser) {
			toast.error("Você precisa estar logado para bloquear usuários");
			return;
		}

		try {
			setIsLoading(true);

			const endpoint = isBlocked ? "/api/user/unblock" : "/api/user/block";
			const response = await fetch(endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					targetUserNickname: profileFound.nickname,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || `Erro ao ${isBlocked ? "desbloquear" : "bloquear"} usuário`);
			}

			const action = isBlocked ? "desbloqueado" : "bloqueado";
			toast.success(`@${profileFound.nickname} foi ${action} com sucesso`);
			setIsBlocked(!isBlocked);
			setIsOpen(false);

			if (isBlocked) {
				onUnblockSuccess?.();
			} else {
				onBlockSuccess?.();
			}
		} catch (error: any) {
			await TelegramLog.error(`Catch Error profile-block-user-button.ts handleBlockAction: ${error?.message}`);
			toast.error(
				error instanceof Error ? error.message : `Erro ao ${isBlocked ? "desbloquear" : "bloquear"} usuário`,
			);
		} finally {
			setIsLoading(false);
		}
	};

	if (!sessionUser) {
		return (
			<Button
				variant="outline"
				disabled
				className="flex-1 min-w-[130px] opacity-50 text-red-600 border-red-200 dark:text-white dark:border-white"
				title="Faça login para bloquear usuários"
			>
				<UserX className="h-4 w-4 mr-2" />
				Bloquear
			</Button>
		);
	}

	if (checkingBlockStatus) {
		return (
			<Button variant="outline" disabled className="flex-1 min-w-[130px] opacity-50">
				Verificando...
			</Button>
		);
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				<Button
					variant="outline"
					className={`flex-1 min-w-[130px] ${
						isBlocked
							? "text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-950"
							: "text-red-600 border-red-200 hover:bg-red-50 dark:text-white dark:border-white dark:hover:bg-gray-800"
					}`}
				>
					{isBlocked ? (
						<>
							<UserCheck className="h-4 w-4 mr-2" />
							Desbloquear
						</>
					) : (
						<>
							<UserX className="h-4 w-4 mr-2" />
							Bloquear
						</>
					)}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{isBlocked ? "Desbloquear usuário" : "Bloquear usuário"}</AlertDialogTitle>
					<AlertDialogDescription>
						{isBlocked ? (
							<>
								Tem certeza que deseja desbloquear <strong>@{profileFound.nickname}</strong>?
								<br />
								<br />
								Quando você desbloqueia alguém:
								<br />
								<br />• Essa pessoa poderá ver seu perfil, enviar perguntas e seguir você novamente
								<br />• Você verá o conteúdo dela novamente no feed
								<br />
							</>
						) : (
							<>
								Tem certeza que deseja bloquear <strong>@{profileFound.nickname}</strong>?
								<br />
								<br />
								Quando você bloqueia alguém:
								<br />
								<br />• Essa pessoa não poderá mais ver seu perfil, te enviar perguntas ou seguir você
								<br />• Você não verá mais o conteúdo dela no seu feed
								<br />
							</>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleBlockAction}
						disabled={isLoading}
						className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
					>
						{isLoading
							? `${isBlocked ? "Desbloqueando" : "Bloqueando"}...`
							: isBlocked
								? "Desbloquear"
								: "Bloquear"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
