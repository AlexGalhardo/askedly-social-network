"use client";

import Script from "next/script";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { contactSchema } from "@/lib/schemas/contact";
import TelegramLog from "@/lib/telegram-logger";

export default function ContatoClient() {
	const [error, setError] = useState("");
	const [turnstileReady, setTurnstileReady] = useState(false);
	const [turnstileRendered, setTurnstileRendered] = useState(false);

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
		const validationResult = contactSchema.safeParse(formData);

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
			token = (window as any).turnstile?.getResponse?.();

			if (!token) {
				setError("Por favor, verifique o CAPTCHA.");
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
					title: "Mensagem enviada com sucesso",
					description: "Vamos responder em breve.",
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
				title: "Erro ao enviar mensagem",
				description: errorData.error || "Por favor, tente novamente mais tarde.",
				variant: "error",
			});
		} catch (error: any) {
			await TelegramLog.error(`Error contato.tsx handleSubmit: ${error?.message}`);
			toast({
				title: "Erro ao enviar mensagem",
				description: "Por favor, tente novamente mais tarde.",
				variant: "error",
			});
		} finally {
			setLoading(false);
			(window as any).turnstile?.reset();
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

	const turnstileRef = useRef<HTMLDivElement>(null);

	const renderTurnstile = () => {
		if (turnstileReady && turnstileRef.current && !turnstileRendered) {
			(window as any).turnstile.render(turnstileRef.current, {
				sitekey: "0x4AAAAAABiCEoK5rM8dg1Xm",
				callback: (token: string) => {},
			});
			setTurnstileRendered(true);
		}
	};

	const handleTurnstileLoad = () => {
		setTurnstileReady(true);
	};

	// Sempre a versão atual de renderTurnstile, sem re-executar o efeito a cada render.
	const onTurnstileReady = useEffectEvent(() => renderTurnstile());

	useEffect(() => {
		if (turnstileReady) {
			onTurnstileReady();
		}
	}, [turnstileReady]);

	useEffect(() => {
		const checkTurnstileAvailability = () => {
			if ((window as any).turnstile && !turnstileReady) {
				setTurnstileReady(true);
			}
		};

		const interval = setInterval(checkTurnstileAvailability, 100);

		return () => clearInterval(interval);
	}, [turnstileReady]);

	useEffect(() => {
		(window as any).onloadTurnstileCallback = () => {
			setTurnstileReady(true);
		};

		return () => {
			delete (window as any).onloadTurnstileCallback;
		};
	}, []);

	return (
		<>
			<Script
				src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback"
				async
				defer
				onLoad={handleTurnstileLoad}
				strategy="afterInteractive"
			/>
			<main className="p-4 lg:p-6">
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-8 dark:text-white p-8 rounded-lg">
						<h2 className="text-3xl font-bold text-foreground mb-4">Contato</h2>
						<p className="text-lg text-muted-foreground">
							Tem alguma dúvida? Encontrou algum problema? Envie nos uma mensagem e retornaremos o mais
							breve possível.
						</p>
					</div>

					<Card>
						<CardContent className="p-6">
							<form onSubmit={handleSubmit} className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-2">
										<Label htmlFor="name">Seu Nome</Label>
										<Input
											id="name"
											name="name"
											minLength={4}
											maxLength={24}
											placeholder="Digite seu nome"
											value={formData.name}
											onChange={handleChange}
											className={`${errors.name ? "border-red-500" : ""}`}
										/>
										{errors.name && (
											<p className="text-red-500 text-sm">
												Nome deve ter entre 4 e 24 caracteres
											</p>
										)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="email">Seu Email</Label>
										<Input
											id="email"
											name="email"
											type="email"
											minLength={12}
											maxLength={48}
											placeholder="seuemail@email.com"
											value={formData.email}
											onChange={handleChange}
											className={`${errors.email ? "border-red-500" : ""}`}
										/>
										{errors.email && <p className="text-red-500 text-sm">Email inválido</p>}
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="subject">Assunto</Label>
									<Select value={formData.subject} onValueChange={handleSelectChange}>
										<SelectTrigger className={`${errors.subject ? "border-red-500" : ""}`}>
											<SelectValue placeholder="Selecione um tópico" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Problemas Técnicos">Problemas Técnicos</SelectItem>
											<SelectItem value="Problemas Com Pagamentos">
												Problemas com Pagamentos
											</SelectItem>
											<SelectItem value="Problemas com Conta">Problemas com Conta</SelectItem>
											<SelectItem value="Sugestões e Feedbacks">Sugestões & Feedbacks</SelectItem>
											<SelectItem value="Outros">Outros</SelectItem>
										</SelectContent>
									</Select>
									{errors.subject && (
										<p className="text-red-500 text-sm">Selecione um assunto válido</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="message">Mensagem</Label>
									<Textarea
										id="message"
										name="message"
										placeholder="Digite sua mensagem"
										rows={6}
										maxLength={1024}
										value={formData.message}
										onChange={handleChange}
										className={`${errors.message ? "border-red-500" : ""}`}
									/>
									{errors.message && (
										<p className="text-red-500 text-sm">
											A mensagem deve ter pelo menos 32 caracteres
										</p>
									)}
								</div>

								<div className="w-full" ref={turnstileRef}></div>

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
									{loading ? "Enviando Mensagem..." : "Enviar Mensagem"}
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
			</main>
		</>
	);
}
