"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import type React from "react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TelegramLog from "@/lib/telegram-logger";

export default function EsqueciSenhaClient() {
	const router = useRouter();
	const t = useTranslations("auth");
	const { data: session } = useSession();

	useEffect(() => {
		if (session) {
			router.push("/feed");
		}
	}, [session, router]);

	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [successAlert, setSuccessAlert] = useState(false);

	const handleSubmitForgetPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
			setError(t("forgotPassword.invalidEmail"));
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/reset-password/request", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error ?? t("forgotPassword.sendError"));
			}

			setSuccessAlert(true);
			setEmail("");
		} catch (error: any) {
			await TelegramLog.error(`Error esqueci-senha.ts handleSubmitForgetPassword: ${error.message}`);
			setError(t("forgotPassword.sendError"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen  flex items-center justify-center p-4">
			<Card className="w-full max-w-md border-none">
				<CardHeader className="text-center">
					<CardDescription className="text-2xl text-black dark:text-white">
						{t("forgotPassword.heading")}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<form onSubmit={handleSubmitForgetPassword} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">{t("fields.email")}</Label>
							<Input
								id="email"
								type="email"
								placeholder={t("fields.emailPlaceholder")}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>

						{error && (
							<Alert variant="destructive" className="font-bold text-center bg-red-300 text-red-900">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{successAlert && (
							<Alert variant="default" className="font-bold text-center bg-green-300 text-green-900">
								<AlertDescription>{t("forgotPassword.success")}</AlertDescription>
							</Alert>
						)}

						<Button
							type="submit"
							className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white"
							disabled={loading}
						>
							{loading ? (
								<>
									<span className="ml-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
									{t("fields.processing")}
								</>
							) : (
								<>
									{t("forgotPassword.submit")}
									<ArrowRight className="ml-2 h-5 w-5" />
								</>
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
