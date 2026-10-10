"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { WithdrawHistory } from "@/lib/interfaces";

interface TransactionHistoryProps {
	transactions: WithdrawHistory[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
	const t = useTranslations("payments");
	const format = useFormatter();

	return (
		<Card>
			<CardContent className="p-6">
				<h2 className="text-xl font-bold text-foreground mb-4">{t("history.title")}</h2>
				<div className="space-y-4">
					{transactions.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">{t("history.empty")}</p>
						</div>
					) : (
						transactions.map((withdraw) => (
							<div
								key={withdraw.id}
								className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
							>
								<div>
									<p className="text-2xl text-foreground">{t("history.withdrawal")}</p>
									<p className="text-muted-foreground">
										{format.dateTime(new Date(withdraw.created_at), {
											day: "2-digit",
											month: "2-digit",
											year: "numeric",
											hour: "2-digit",
											minute: "2-digit",
											// Without this next-intl would use the server's time zone instead of the viewer's.
											timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
										})}
									</p>
									<p className="text-orange-500 font-bold">
										{t("history.pixKey", { key: withdraw.send_to_pix_key })}
									</p>
								</div>
								<p className="font-bold text-green-600 dark:text-foreground">
									{format.number(withdraw.amount_withdraw / 100, {
										style: "currency",
										currency: "BRL",
									})}
								</p>
							</div>
						))
					)}
				</div>
			</CardContent>
		</Card>
	);
}
