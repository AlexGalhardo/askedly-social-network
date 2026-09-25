"use client";

import { Clock, DollarSign } from "lucide-react";
import { canWithdraw, getMinimumWithdrawMessage } from "@/lib/utils/payment-utils";
import { PaymentData } from "@/types/PaymentInterface";
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
	const isAnswered = type === "answered";

	return (
		<div className="space-y-6 mt-4">
			<PaymentCard
				title={isAnswered ? "Pronto Para Sacar" : "Disponível Para Saque"}
				amount={data.paymentToWithdraw}
				description={
					isAnswered
						? "Valor das perguntas que você respondeu e foram aprovadas"
						: "Perguntas pagas que você enviou e foram expiradas ou recusadas a responder"
				}
				icon={DollarSign}
				iconBgColor="bg-green-600 dark:bg-foreground"
				cardBgColor="bg-green-50 dark:bg-muted"
				borderColor="border-green-200 dark:border-border"
				titleColor="text-green-600 dark:text-foreground"
				warning={!canWithdraw(data.paymentToWithdraw) ? getMinimumWithdrawMessage() : undefined}
			>
				<WithdrawButton
					amount={data.paymentToWithdraw}
					onWithdraw={onWithdraw}
					isProcessing={isProcessingWithdraw}
				/>
			</PaymentCard>

			<PaymentCard
				title={isAnswered ? "Valor Pendente Para Responder" : "Valor Aguardando Resposta"}
				amount={data.paymentAwaitingAnswer}
				description={
					isAnswered
						? "Valor das perguntas aguardando sua resposta"
						: "Valor total que você pagou fazendo perguntas que ainda estão esperando resposta."
				}
				icon={Clock}
				iconBgColor="bg-orange-600 dark:bg-muted-foreground"
				cardBgColor="bg-orange-50 dark:bg-muted"
				borderColor="border-orange-200 dark:border-border"
				titleColor="text-orange-600 dark:text-foreground"
			/>

			{!isAnswered && data.paymentSentAnsweredQuestions !== undefined && (
				<PaymentCard
					title="Total Pago em Perguntas Respondidas"
					amount={data.paymentSentAnsweredQuestions}
					description="Valor total que você pagou para fazer perguntas e foram respondidas adequadamente."
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
