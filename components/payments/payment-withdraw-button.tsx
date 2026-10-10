"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { canWithdraw } from "@/lib/utils/payment-utils";

interface WithdrawButtonProps {
	amount: number;
	onWithdraw: () => void;
	isProcessing?: boolean;
}

export function WithdrawButton({ amount, onWithdraw, isProcessing = false }: WithdrawButtonProps) {
	const t = useTranslations("payments");
	const canWithdrawAmount = canWithdraw(amount);

	if (!canWithdrawAmount) {
		return (
			<Button size="lg" disabled className="bg-green-600 text-white opacity-50 cursor-not-allowed">
				{t("withdraw.button")}
			</Button>
		);
	}

	return (
		<Button
			size="lg"
			onClick={onWithdraw}
			className="bg-green-600 hover:bg-green-700 text-white dark:bg-foreground dark:text-background dark:hover:bg-green-500"
			disabled={isProcessing}
		>
			{isProcessing ? t("withdraw.processing") : t("withdraw.button")}
		</Button>
	);
}
