"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPolicyClient() {
	const t = useTranslations("legal");
	const format = useFormatter();

	return (
		<div className="p-4 lg:p-6">
			<Card className="border-none bg-transparent shadow-none">
				<CardContent className="p-6 prose prose-gray dark:prose-invert max-w-none">
					<p className="text-muted-foreground mb-6">
						{t("lastUpdated", {
							date: format.dateTime(new Date(Date.UTC(2025, 5, 15)), {
								dateStyle: "long",
								timeZone: "UTC",
							}),
						})}
					</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("privacy.collectTitle")}</h2>
					<p className="mb-6">{t("privacy.collectBody")}</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("privacy.useTitle")}</h2>
					<p className="mb-6">{t("privacy.useBody")}</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("privacy.sharingTitle")}</h2>
					<p className="mb-4">{t("privacy.sharingBody")}</p>
					<p className="mb-6">
						{t.rich("privacy.sharingTools", {
							link: (chunks) => (
								<a
									href={t("privacy.microsoftPrivacyUrl")}
									target="_blank"
									className="text-blue-600 underline"
									rel="noopener"
								>
									{chunks}
								</a>
							),
						})}
					</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("privacy.securityTitle")}</h2>
					<p className="mb-6">{t("privacy.securityBody")}</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("privacy.rightsTitle")}</h2>
					<p className="mb-6">{t("privacy.rightsBody")}</p>

					<h2 className="text-xl font-bold text-foreground mb-4">{t("privacy.contactTitle")}</h2>
					<p className="mb-4">
						{t.rich("privacy.contactBody", { link: (chunks) => <a href="/contact">{chunks}</a> })}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
