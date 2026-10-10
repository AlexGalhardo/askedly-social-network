"use client";

import { UserCheck, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
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
	const t = useTranslations("profile");
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
			toast.error(t("block.loginRequired"));
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
				throw new Error(errorData.message || t(isBlocked ? "block.unblockFailed" : "block.blockFailed"));
			}

			toast.success(t(isBlocked ? "block.unblocked" : "block.blocked", { nickname: profileFound.nickname }));
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
				error instanceof Error ? error.message : t(isBlocked ? "block.unblockFailed" : "block.blockFailed"),
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
				title={t("block.loginTitle")}
			>
				<UserX className="h-4 w-4 mr-2" />
				{t("block.block")}
			</Button>
		);
	}

	if (checkingBlockStatus) {
		return (
			<Button variant="outline" disabled className="flex-1 min-w-[130px] opacity-50">
				{t("block.checking")}
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
							{t("block.unblock")}
						</>
					) : (
						<>
							<UserX className="h-4 w-4 mr-2" />
							{t("block.block")}
						</>
					)}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{isBlocked ? t("block.unblockTitle") : t("block.blockTitle")}</AlertDialogTitle>
					<AlertDialogDescription>
						{isBlocked ? (
							<>
								{t.rich("block.unblockConfirm", {
									nickname: profileFound.nickname,
									strong: (chunks) => <strong>{chunks}</strong>,
								})}
								<br />
								<br />
								{t("block.unblockIntro")}
								<br />
								<br />• {t("block.unblockEffect1")}
								<br />• {t("block.unblockEffect2")}
								<br />
							</>
						) : (
							<>
								{t.rich("block.blockConfirm", {
									nickname: profileFound.nickname,
									strong: (chunks) => <strong>{chunks}</strong>,
								})}
								<br />
								<br />
								{t("block.blockIntro")}
								<br />
								<br />• {t("block.blockEffect1")}
								<br />• {t("block.blockEffect2")}
								<br />
							</>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>{t("block.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleBlockAction}
						disabled={isLoading}
						className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
					>
						{isLoading
							? t(isBlocked ? "block.unblocking" : "block.blocking")
							: t(isBlocked ? "block.unblock" : "block.block")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
