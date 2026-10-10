import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboard, isAdmin } from "@/lib/services/admin.service";
import { getSessionUser } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("admin");
	return { title: t("title"), robots: { index: false } };
}

export default async function AdminPage() {
	const user = await getSessionUser();
	// 404 para quem não é admin: a página nem revela que existe.
	if (!user || !(await isAdmin(user.id))) notFound();

	const [t, format, data] = await Promise.all([getTranslations("admin"), getFormatter(), getAdminDashboard()]);
	const money = (cents: number, currency: "BRL" | "USD") =>
		format.number(cents / 100, { style: "currency", currency });

	const stats: [string, string | number][] = [
		[t("users"), data.users],
		[t("payoutAccounts"), data.payoutAccounts],
		[t("questions"), data.questions.total],
		[t("answered"), data.questions.answered],
		[t("awaiting"), data.questions.awaiting],
		[t("refused"), data.questions.refused],
		[t("expired"), data.questions.expired],
		[t("pixVolume"), money(data.brl.volumeCents, "BRL")],
		[t("pixRevenue"), money(data.brl.platformRevenueCents, "BRL")],
		[t("creditsVolume"), money(data.usd.volumeCents, "USD")],
		[t("creditsRevenue"), money(data.usd.platformRevenueCents, "USD")],
		[t("creditsPurchased"), money(data.credits.purchasedCents, "USD")],
		[t("creditsOutstanding"), money(data.credits.outstandingCents, "USD")],
		[t("pendingSettlements"), data.credits.pendingSettlements],
		[t("withdrawals"), data.withdrawals.count],
		[t("withdrawalsTotal"), money(data.withdrawals.totalCents, "BRL")],
	];

	return (
		<div className="p-4 lg:p-6 space-y-6">
			<h1 className="text-2xl font-bold">{t("title")}</h1>

			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{stats.map(([label, value]) => (
					<Card key={label}>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
						</CardHeader>
						<CardContent className="text-2xl font-bold">{value}</CardContent>
					</Card>
				))}
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>{t("latestPurchases")}</CardTitle>
					</CardHeader>
					<CardContent>
						{data.latestPurchases.length === 0 ? (
							<p className="text-sm text-muted-foreground">{t("empty")}</p>
						) : (
							<ul className="space-y-2 text-sm">
								{data.latestPurchases.map((purchase) => (
									<li key={purchase.id} className="flex justify-between gap-2">
										<span>
											@{purchase.nickname} · {purchase.status}
										</span>
										<span>
											{money(purchase.amountCents, "USD")} ·{" "}
											{format.dateTime(purchase.createdAt, { dateStyle: "short" })}
										</span>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>{t("latestWithdrawals")}</CardTitle>
					</CardHeader>
					<CardContent>
						{data.latestWithdrawals.length === 0 ? (
							<p className="text-sm text-muted-foreground">{t("empty")}</p>
						) : (
							<ul className="space-y-2 text-sm">
								{data.latestWithdrawals.map((withdrawal) => (
									<li key={withdrawal.id} className="flex justify-between gap-2">
										<span>@{withdrawal.nickname}</span>
										<span>
											{money(withdrawal.amountCents, "BRL")} ·{" "}
											{format.dateTime(withdrawal.createdAt, { dateStyle: "short" })}
										</span>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
