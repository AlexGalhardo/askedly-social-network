"use client";

import { Loader2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const CREDIT_AMOUNTS = [5, 10, 20, 50, 100];

interface StripeAccount {
	credits: number;
	payoutStatus: "none" | "pending" | "active";
}

export function StripeForm() {
	const { toast } = useToast();
	const t = useTranslations("account.stripe");
	const format = useFormatter();
	const [account, setAccount] = useState<StripeAccount | null>(null);
	const [country, setCountry] = useState("");
	const [isRedirecting, setIsRedirecting] = useState(false);

	useEffect(() => {
		fetch("/api/stripe/connect")
			.then((res) => (res.ok ? res.json() : null))
			.then(setAccount)
			.catch(() => setAccount(null));
	}, []);

	// Both actions return a Stripe-hosted URL (Checkout or payout account onboarding).
	const redirectToStripe = async (endpoint: string, body: object) => {
		setIsRedirecting(true);
		try {
			const response = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
			const result = await response.json();
			if (!response.ok || !result.url) throw new Error(result.error);
			window.location.assign(result.url);
		} catch (error: unknown) {
			toast({
				title: t("errorTitle"),
				description: (error as Error)?.message || t("openError"),
				variant: "error",
			});
			setIsRedirecting(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("title")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-2">
					<p className="text-sm">
						{t.rich("balance", {
							amount: format.number((account?.credits ?? 0) / 100, {
								style: "currency",
								currency: "USD",
							}),
							strong: (chunks) => <strong>{chunks}</strong>,
						})}
					</p>
					<div className="flex flex-wrap gap-2">
						{CREDIT_AMOUNTS.map((amount) => (
							<Button
								key={amount}
								variant="outline"
								disabled={isRedirecting}
								onClick={() => redirectToStripe("/api/stripe/checkout", { amount: amount * 100 })}
							>
								{format.number(amount, { style: "currency", currency: "USD" })}
							</Button>
						))}
					</div>
				</div>

				<div className="space-y-2">
					{account?.payoutStatus === "active" ? (
						<p className="text-sm text-green-600 font-medium">{t("payoutActive")}</p>
					) : (
						<>
							<p className="text-sm text-gray-500 dark:text-gray-400">{t("payoutSetup")}</p>
							{account?.payoutStatus !== "pending" && (
								<div className="space-y-2">
									<Label htmlFor="stripe-country">{t("countryLabel")}</Label>
									<Input
										id="stripe-country"
										value={country}
										maxLength={2}
										onChange={(e) => setCountry(e.target.value.toUpperCase())}
										className="w-24"
									/>
								</div>
							)}
							<Button
								disabled={
									isRedirecting || (account?.payoutStatus !== "pending" && country.length !== 2)
								}
								onClick={() => redirectToStripe("/api/stripe/connect", { country: country || "US" })}
							>
								{isRedirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{account?.payoutStatus === "pending" ? t("continueOnboarding") : t("startOnboarding")}
							</Button>
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
