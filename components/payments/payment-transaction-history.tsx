"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils/payment-utils";
import { WithdrawHistory } from "@/types/PaymentInterface";

interface TransactionHistoryProps {
	transactions: WithdrawHistory[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
	return (
		<Card>
			<CardContent className="p-6">
				<h2 className="text-xl font-bold text-foreground mb-4">Histórico de Transações</h2>
				<div className="space-y-4">
					{transactions.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">Nenhuma transação encontrada</p>
						</div>
					) : (
						transactions.map((withdraw) => (
							<div
								key={withdraw.id}
								className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
							>
								<div>
									<p className="text-2xl text-foreground">Saque realizado</p>
									<p className="text-muted-foreground">{formatDate(withdraw.created_at)}</p>
									<p className="text-orange-500 font-bold">PIX: {withdraw.send_to_pix_key}</p>
								</div>
								<p className="font-bold text-green-600 dark:text-foreground">
									R$ {formatCurrency(withdraw.amount_withdraw)}
								</p>
							</div>
						))
					)}
				</div>
			</CardContent>
		</Card>
	);
}
