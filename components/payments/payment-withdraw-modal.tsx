"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { validatePixKey } from "@/lib/utils/payment-utils";

interface WithdrawModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	amount: number;
	pixKey: string | null | undefined;
	onConfirmWithdraw: () => void;
	isProcessing?: boolean;
}

export function PaymentWithdrawModal({
	isOpen,
	onOpenChange,
	amount,
	pixKey,
	onConfirmWithdraw,
	isProcessing = false,
}: WithdrawModalProps) {
	const t = useTranslations("payments");
	const format = useFormatter();
	const [confirmationInput, setConfirmationInput] = useState("");

	const hasValidPixKey = validatePixKey(pixKey);
	const isInputMatching = confirmationInput === pixKey;

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				{!hasValidPixKey ? (
					<>
						<DialogHeader>
							<DialogTitle className="text-2xl font-bold">{t("withdraw.noPixKeyTitle")}</DialogTitle>
							<DialogDescription className="mt-2 text-base">
								{t("withdraw.noPixKeyDescription")}
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button onClick={() => onOpenChange(false)}>{t("withdraw.understood")}</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>
								<span className="text-3xl font-bold mb-12">
									{t("withdraw.title", {
										amount: format.number(amount / 100, { style: "currency", currency: "BRL" }),
									})}
								</span>
							</DialogTitle>
							<DialogDescription>
								<span className="mt-3 mb-3 text-2xl">
									{t("withdraw.confirmKey")}
									<br />
									<br />
									<strong className="text-blue-600 break-all dark:text-white">{pixKey}</strong>
								</span>
							</DialogDescription>
						</DialogHeader>

						<div className="mt-4 space-y-2">
							<label htmlFor="confirmPixKey" className="text-base font-medium">
								{t("withdraw.typeKey")}
							</label>
							<Input
								id="confirmPixKey"
								type="text"
								placeholder={pixKey as string}
								value={confirmationInput}
								onChange={(e) => setConfirmationInput(e.target.value)}
								className="text-lg"
							/>
						</div>

						<DialogFooter>
							<Button
								type="button"
								onClick={onConfirmWithdraw}
								className="bg-green-500 text-white hover:bg-green-800 font-bold px-6 py-6 text-2xl mt-6 w-full"
								disabled={isProcessing || !isInputMatching}
							>
								{isProcessing ? t("withdraw.processingWithdraw") : t("withdraw.confirm")}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
