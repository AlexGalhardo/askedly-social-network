"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { createContactSchema } from "@/lib/schemas/contact";
import TelegramLog from "@/lib/telegram-logger";
import { getTurnstile } from "@/lib/turnstile";

export default function ContatoClient() {
	const t = useTranslations("legal.contact");
	const tValidation = useTranslations("legal.contact.validation");
	const tCommon = useTranslations("common");
	const tErrors = useTranslations("errors");
	const [error, setError] = useState("");

	const [formData, setFormData] = useState({
		name: "",
		email: "",
		subject: "",
		message: "",
	});
	const [errors, setErrors] = useState({
		name: false,
		email: false,
		subject: false,
		message: false,
	});
	const [loading, setLoading] = useState(false);

	const validateForm = () => {
		const validationResult = createContactSchema(tValidation).safeParse(formData);

		if (validationResult.success) {
			setErrors({
				name: false,
				email: false,
				subject: false,
				message: false,
			});
			return true;
		}

		const newErrors = {
			name: false,
			email: false,
			subject: false,
			message: false,
		};

		validationResult.error.issues.forEach((error) => {
			const field = error.path[0] as keyof typeof newErrors;
			if (field) {
				newErrors[field] = true;
			}
		});

		setErrors(newErrors);
		return false;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		setLoading(true);

		let token = null;

		if (process.env.NODE_ENV === "production") {
			token = getTurnstile()?.getResponse();

			if (!token) {
				setError(tErrors("captchaRequired"));
				setLoading(false);
				return;
			}
		}

		try {
			const response = await fetch("/api/send-contact-email", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ ...formData, captchaToken: token }),
			});

			if (response.ok) {
				toast({
					title: t("successTitle"),
					description: t("successDescription"),
					variant: "success",
				});
				setFormData({
					name: "",
					email: "",
					subject: "",
					message: "",
				});
				return;
			}

			const errorData = await response.json();
			toast({
				title: t("errorTitle"),
				description: errorData.error || tCommon("tryAgainLater"),
				variant: "error",
			});
		} catch (error: any) {
			await TelegramLog.error(`Error contato.tsx handleSubmit: ${error?.message}`);
			toast({
				title: t("errorTitle"),
				description: tCommon("tryAgainLater"),
				variant: "error",
			});
		} finally {
			setLoading(false);
			getTurnstile()?.reset();
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;

		let transformedValue = value;

		if (name === "name") {
			transformedValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");

			transformedValue = transformedValue
				.split(" ")
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
				.join(" ");
		}

		setFormData((prev) => ({ ...prev, [name]: transformedValue }));
	};

	const handleSelectChange = (value: string) => {
		setFormData((prev) => ({ ...prev, subject: value }));
	};

	return (
		<div className="p-4 lg:p-6">
			<div className="max-w-6xl mx-auto">
				<div className="text-center mb-8 dark:text-white p-8 rounded-lg">
					<h2 className="text-3xl font-bold text-foreground mb-4">{t("title")}</h2>
					<p className="text-lg text-muted-foreground">{t("intro")}</p>
				</div>

				<Card>
					<CardContent className="p-6">
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label htmlFor="name">{t("nameLabel")}</Label>
									<Input
										id="name"
										name="name"
										minLength={4}
										maxLength={24}
										placeholder={t("namePlaceholder")}
										value={formData.name}
										onChange={handleChange}
										className={`${errors.name ? "border-red-500" : ""}`}
									/>
									{errors.name && <p className="text-red-500 text-sm">{tValidation("nameLength")}</p>}
								</div>

								<div className="space-y-2">
									<Label htmlFor="email">{t("emailLabel")}</Label>
									<Input
										id="email"
										name="email"
										type="email"
										minLength={12}
										maxLength={48}
										placeholder={t("emailPlaceholder")}
										value={formData.email}
										onChange={handleChange}
										className={`${errors.email ? "border-red-500" : ""}`}
									/>
									{errors.email && (
										<p className="text-red-500 text-sm">{tValidation("emailInvalid")}</p>
									)}
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="subject">{t("subjectLabel")}</Label>
								<Select value={formData.subject} onValueChange={handleSelectChange}>
									<SelectTrigger className={`${errors.subject ? "border-red-500" : ""}`}>
										<SelectValue placeholder={t("subjectPlaceholder")} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Problemas Técnicos">{t("subjectTechnical")}</SelectItem>
										<SelectItem value="Problemas Com Pagamentos">{t("subjectPayments")}</SelectItem>
										<SelectItem value="Problemas com Conta">{t("subjectAccount")}</SelectItem>
										<SelectItem value="Sugestões e Feedbacks">{t("subjectFeedback")}</SelectItem>
										<SelectItem value="Outros">{t("subjectOther")}</SelectItem>
									</SelectContent>
								</Select>
								{errors.subject && (
									<p className="text-red-500 text-sm">{tValidation("subjectSelect")}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="message">{t("messageLabel")}</Label>
								<Textarea
									id="message"
									name="message"
									placeholder={t("messagePlaceholder")}
									rows={6}
									maxLength={1024}
									value={formData.message}
									onChange={handleChange}
									className={`${errors.message ? "border-red-500" : ""}`}
								/>
								{errors.message && <p className="text-red-500 text-sm">{tValidation("messageMin")}</p>}
							</div>

							<TurnstileWidget />

							{error && error !== "Callback" && (
								<Alert
									variant="destructive"
									className="font-bold text-center bg-red-300 text-red-900 dark:bg-red-800 dark:text-red-100"
								>
									<AlertDescription>{error}</AlertDescription>
								</Alert>
							)}

							<Button
								type="submit"
								className="w-full bg-green-600 hover:bg-green-700 text-white"
								disabled={loading}
							>
								{loading ? t("submitting") : t("submit")}
							</Button>
						</form>
					</CardContent>
				</Card>
				{/* <p className="text-sm text-muted-foreground mt-12 text-center">
						Rua Pais Leme 215. C1713 E1 VG PINHEIROS THERA FARIA LIMA CEP 05424-150
					</p>
					<p className="text-center text-sm text-muted-foreground mt-3">
						CNPJ 61.414.573/0001-56 Galhardo Tecnologia da Informação LTDA
					</p> */}
			</div>
		</div>
	);
}
