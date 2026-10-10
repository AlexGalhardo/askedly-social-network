"use client";

import { Clock, DollarSign } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { PaymentData } from "@/lib/interfaces";
import { canWithdraw, MIN_WITHDRAW_CENTS } from "@/lib/utils/payment-utils";
import { PaymentCard } from "./payment-card";
import { TransactionHistory } from "./payment-transaction-history";
import { WithdrawButton } from "./payment-withdraw-button";

interface PaymentTabContentProps {
	data: PaymentData;
	type: "answered" | "sent";
	onWithdraw: () => void;
	isProcessingWithdraw?: boolean;
}

export function PaymentTabContent({ data, type, onWithdraw, isProcessingWithdraw = false }: PaymentTabContentProps) {
	const t = useTranslations("payments");
	const format = useFormatter();
	const isAnswered = type === "answered";

	return (
		<div className="space-y-6 mt-4">
			<PaymentCard
				title={t(`${type}.withdrawTitle`)}
				amount={data.paymentToWithdraw}
				description={t(`${type}.withdrawDescription`)}
				icon={DollarSign}
				iconBgColor="bg-green-600 dark:bg-foreground"
				cardBgColor="bg-green-50 dark:bg-muted"
				borderColor="border-green-200 dark:border-border"
				titleColor="text-green-600 dark:text-foreground"
				warning={
					!canWithdraw(data.paymentToWithdraw)
						? t("minimumWithdraw", {
								amount: format.number(MIN_WITHDRAW_CENTS / 100, {
									style: "currency",
									currency: "BRL",
									maximumFractionDigits: 0,
								}),
							})
						: undefined
				}
			>
				<WithdrawButton
					amount={data.paymentToWithdraw}
					onWithdraw={onWithdraw}
					isProcessing={isProcessingWithdraw}
				/>
			</PaymentCard>

			<PaymentCard
				title={t(`${type}.pendingTitle`)}
				amount={data.paymentAwaitingAnswer}
				description={t(`${type}.pendingDescription`)}
				icon={Clock}
				iconBgColor="bg-orange-600 dark:bg-muted-foreground"
				cardBgColor="bg-orange-50 dark:bg-muted"
				borderColor="border-orange-200 dark:border-border"
				titleColor="text-orange-600 dark:text-foreground"
			/>

			{!isAnswered && data.paymentSentAnsweredQuestions !== undefined && (
				<PaymentCard
					title={t("sent.paidTitle")}
					amount={data.paymentSentAnsweredQuestions}
					description={t("sent.paidDescription")}
					icon={DollarSign}
					iconBgColor="bg-blue-600 dark:bg-foreground"
					cardBgColor="bg-blue-50 dark:bg-muted"
					borderColor="border-blue-200 dark:border-border"
					titleColor="text-blue-600 dark:text-foreground"
				/>
			)}

			<TransactionHistory transactions={data.paymentWithdrawHistory} />
		</div>
	);
}
