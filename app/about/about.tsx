"use client";

import { CreditCard, DollarSign, MessageCircle, Shield, Users } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SobreClient() {
	const { data: session } = useSession();
	const t = useTranslations("legal.about");
	const format = useFormatter();

	const compact = (value: number): string => format.number(value, { notation: "compact" });

	return (
		<div className="p-4 lg:p-6">
			<div className="space-y-6 max-w-4xl">
				<Card>
					<CardContent className="p-8 text-center">
						<h2 className="text-3xl font-bold text-foreground mb-4">{t("heroTitle")}</h2>
						<p className="text-lg text-muted-foreground mb-6">{t("heroBody")}</p>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<h3 className="text-xl font-bold text-foreground mb-6 text-center">{t("statsTitle")}</h3>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
							<div>
								<div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
									{t("statValue", { value: compact(1000) })}
								</div>
								<div className="text-sm text-muted-foreground">{t("statUsers")}</div>
							</div>
							<div>
								<div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
									{t("statValue", { value: compact(10000) })}
								</div>
								<div className="text-sm text-muted-foreground">{t("statAnswered")}</div>
							</div>
							<div>
								<div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
									{t("statValue", {
										value: format.number(10000, {
											style: "currency",
											currency: "BRL",
											notation: "compact",
										}),
									})}
								</div>
								<div className="text-sm text-muted-foreground">{t("statPaid")}</div>
							</div>
							<div>
								<div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
									{t("statValue", { value: compact(10000) })}
								</div>
								<div className="text-sm text-muted-foreground">{t("statLikes")}</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<h3 className="text-2xl font-bold text-foreground mb-6">{t("howTitle")}</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							<div className="text-center">
								<div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
									<Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
								</div>
								<h4 className="font-bold text-foreground mb-2">{t("step1Title")}</h4>
								<p className="text-sm text-muted-foreground">{t("step1Body")}</p>
							</div>
							<div className="text-center">
								<div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
									<MessageCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
								</div>
								<h4 className="font-bold text-foreground mb-2">{t("step2Title")}</h4>
								<p className="text-sm text-muted-foreground">{t("step2Body")}</p>
							</div>
							<div className="text-center">
								<div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
									<DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
								</div>
								<h4 className="font-bold text-foreground mb-2">{t("step3Title")}</h4>
								<p className="text-sm text-muted-foreground">{t("step3Body")}</p>
							</div>
							<div className="text-center">
								<div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
									<Shield className="h-8 w-8 text-orange-600 dark:text-orange-400" />
								</div>
								<h4 className="font-bold text-foreground mb-2">{t("step4Title")}</h4>
								<p className="text-sm text-muted-foreground">{t("step4Body")}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<h3 className="flex items-center text-2xl font-bold text-foreground mb-4">
							<CreditCard className="mr-3 h-6 w-6 text-green-600 dark:text-green-400" />
							{t("paymentsTitle")}
						</h3>
						<p className="text-muted-foreground">{t("paymentsBody")}</p>
					</CardContent>
				</Card>

				{!session && (
					<Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
						<CardContent className="p-8 text-center">
							<h3 className="text-2xl font-bold text-foreground mb-4">{t("ctaTitle")}</h3>
							<p className="text-muted-foreground mb-6">{t("ctaBody")}</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<Button
									render={<Link href="/signup" />}
									className="bg-green-600 hover:bg-green-700 text-white"
								>
									{t("ctaButton")}
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
