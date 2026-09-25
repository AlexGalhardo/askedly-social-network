"use client";

import { AlertCircle, CheckCircle2, Eye, EyeOff, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import type React from "react";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TelegramLog from "@/lib/telegram-logger";

export default function ResetarSenhaComponent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");
	const { data: session } = useSession();

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [tokenValid, setTokenValid] = useState(false);
	const [tokenChecking, setTokenChecking] = useState(true);

	const [passwordValidation, setPasswordValidation] = useState({
		length: false,
		uppercase: false,
		number: false,
		special: false,
	});

	const [passwordValid, setPasswordValid] = useState(false);

	useEffect(() => {
		if (session) return router.push("/feed");

		if (!token) return router.push("/");

		const verifyToken = async () => {
			try {
				setTokenChecking(true);
				const response = await fetch(`/api/reset-password/verify?token=${token}`);

				if (!response.ok) return router.push("/");

				setTokenValid(true);
			} catch (error: any) {
				await TelegramLog.error(`Catch Error file resetar-senha.ts verifyToken: ${error?.message}`);
				router.push("/");
			} finally {
				setTokenChecking(false);
			}
		};

		verifyToken();
	}, [token, router, session]);

	useEffect(() => {
		const hasMinLength = password.length >= 8;
		const hasUppercase = /[A-Z]/.test(password);
		const hasNumber = /[0-9]/.test(password);
		const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

		setPasswordValidation({
			length: hasMinLength,
			uppercase: hasUppercase,
			number: hasNumber,
			special: hasSpecial,
		});

		setPasswordValid(hasMinLength && hasUppercase && hasNumber && hasSpecial);
	}, [password]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!passwordValid) {
			setError("Por favor, corrija os requisitos de senha antes de continuar.");
			return;
		}

		if (password !== confirmPassword) {
			setError("A nova senha e confirmar nova senha não são iguais.");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/reset-password/reset", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token, password }),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error ?? "Falha ao redefinir senha");
			}

			setSuccess(true);

			setTimeout(() => {
				router.push("/entrar");
			}, 3000);
		} catch (error: any) {
			await TelegramLog.error(`Error resetting password: ${error?.message}`);
			setError("Ocorreu um erro ao redefinir sua senha. Try again.");
		} finally {
			setLoading(false);
		}
	};

	if (tokenChecking) {
		return (
			<div className="min-h-screen flex items-center justify-center text-black">
				<p>Verificando Link para Redefinição de Senha...</p>
			</div>
		);
	}

	// O efeito de validação acima já redireciona quando o token é inválido.
	if (!tokenValid) return null;

	return (
		<div className="min-h-screen flex items-center justify-center text-black p-4">
			<div className="w-full max-w-md">
				<Card className="border-0 text-black">
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl font-bold text-center">Crie Sua Nova Senha</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertCircle className="h-4 w-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						{success ? (
							<div className="text-center p-4 bg-green-600 rounded-md">
								<p className="text-white font-bold mb-2">Senha atualizada com sucesso!</p>
								<p className="text-white font-bold">
									Você será redirecionado para a página de login em breve...
								</p>
							</div>
						) : (
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="password">Nova Senha</Label>
									<div className="relative">
										<Input
											id="password"
											type={showPassword ? "text" : "password"}
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											required
											className="bg-white border-gray-700"
										/>
										<button
											type="button"
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600"
											onClick={() => setShowPassword(!showPassword)}
										>
											{showPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</button>
									</div>

									{password && (
										<div className="mt-2 text-sm space-y-1">
											<p className="font-medium">A senha deve conter:</p>
											<div className="flex items-center">
												{passwordValidation.length ? (
													<CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
												) : (
													<XCircle className="h-4 w-4 text-red-500 mr-2" />
												)}
												<span
													className={
														passwordValidation.length ? "text-green-500" : "text-red-500"
													}
												>
													Pelo menos 8 caracteres
												</span>
											</div>
											<div className="flex items-center">
												{passwordValidation.uppercase ? (
													<CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
												) : (
													<XCircle className="h-4 w-4 text-red-500 mr-2" />
												)}
												<span
													className={
														passwordValidation.uppercase ? "text-green-500" : "text-red-500"
													}
												>
													Pelo menos 1 letra maiúscula
												</span>
											</div>
											<div className="flex items-center">
												{passwordValidation.number ? (
													<CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
												) : (
													<XCircle className="h-4 w-4 text-red-500 mr-2" />
												)}
												<span
													className={
														passwordValidation.number ? "text-green-500" : "text-red-500"
													}
												>
													Pelo menos 1 número
												</span>
											</div>
											<div className="flex items-center">
												{passwordValidation.special ? (
													<CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
												) : (
													<XCircle className="h-4 w-4 text-red-500 mr-2" />
												)}
												<span
													className={
														passwordValidation.special ? "text-green-500" : "text-red-500"
													}
												>
													Pelo menos 1 caractere especial
												</span>
											</div>
										</div>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
									<div className="relative">
										<Input
											id="confirm-password"
											type={showConfirmPassword ? "text" : "password"}
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
											required
											className="bg-white border-gray-700"
										/>
										<button
											type="button"
											className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-600"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										>
											{showConfirmPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</button>
									</div>
								</div>

								<Button
									type="submit"
									className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
									disabled={loading}
								>
									{loading ? "Mudando senha..." : "Criar Nova Senha"}
								</Button>
							</form>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
