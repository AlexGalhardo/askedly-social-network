"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";

export default function TermosDeUsoClient() {
	const t = useTranslations("legal");
	const format = useFormatter();

	const brl = (value: number, fractionDigits = 0): string =>
		format.number(value, {
			style: "currency",
			currency: "BRL",
			minimumFractionDigits: fractionDigits,
			maximumFractionDigits: fractionDigits,
		});
	const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

	return (
		<div className="p-4 lg:p-6">
			<Card className="border-none">
				<CardContent className="p-6 prose prose-gray dark:prose-invert max-w-none">
					<p className="text-muted-foreground mb-6">
						{t("lastUpdated", {
							date: format.dateTime(new Date(Date.UTC(2026, 9, 10)), {
								dateStyle: "long",
								timeZone: "UTC",
							}),
						})}
					</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("terms.acceptanceTitle")}</h2>
					<p className="mb-6">{t.rich("terms.acceptanceBody", { strong })}</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("terms.serviceTitle")}</h2>
					<p className="mb-6">
						{t("terms.serviceBody", {
							min: brl(2, 2),
							v2: brl(2),
							v5: brl(5),
							v10: brl(10),
							v20: brl(20),
							v50: brl(50),
						})}
					</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("terms.limitsTitle")}</h2>
					<p className="mb-6">{t.rich("terms.limitsBody", { strong })}</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("terms.paymentsTitle")}</h2>
					<p className="mb-6">{t("terms.paymentsBody")}</p>
					<ul className="list-disc pl-6 mb-6">
						<li>{t("terms.paymentsFeeLow", { v5: brl(5) })}</li>
						<li>{t("terms.paymentsFeeHigh", { v5: brl(5) })}</li>
						<li>{t("terms.paymentsExample1", { v5: brl(5), half5: brl(2.5, 2) })}</li>
						<li>{t("terms.paymentsExample2", { v10: brl(10), fee10: brl(3), net10: brl(7) })}</li>
					</ul>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("terms.methodsTitle")}</h2>
					<p className="mb-6">{t("terms.methodsBody")}</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("terms.privacyTitle")}</h2>
					<p className="mb-6">{t("terms.privacyBody")}</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("terms.validityTitle")}</h2>
					<p className="mb-6">{t.rich("terms.validityBody", { strong })}</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("terms.conductTitle")}</h2>
					<p className="mb-6">{t("terms.conductBody")}</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("terms.reportsTitle")}</h2>
					<p className="mb-4">{t("terms.reportsBody")}</p>
					<p className="mb-4">{t("terms.reportsIntro")}</p>
					<ul className="list-disc pl-6 mb-6">
						<li>{t("terms.reportsPenalty1")}</li>
						<li>{t("terms.reportsPenalty2")}</li>
						<li>{t("terms.reportsPenalty3")}</li>
					</ul>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("terms.withdrawalsTitle")}</h2>
					<p className="mb-6">
						{t("terms.withdrawalsBody", { minWithdraw: brl(100) })}
						<br />
						{t("terms.refundsBody", { minWithdraw: brl(100) })}
					</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("terms.liabilityTitle")}</h2>
					<p className="mb-6">{t("terms.liabilityBody")}</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("terms.inactiveTitle")}</h2>
					<p className="mb-6">{t("terms.inactiveBody")}</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("terms.changesTitle")}</h2>
					<p className="mb-6">{t("terms.changesBody")}</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("terms.contactTitle")}</h2>
					<p className="mb-4">
						{t.rich("terms.contactBody", { link: (chunks) => <a href="/contato">{chunks}</a> })}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
