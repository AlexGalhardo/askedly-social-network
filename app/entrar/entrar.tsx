"use client";

import { ArrowRight, Check, Eye, EyeOff, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AUTH_ERROR } from "@/lib/auth-errors";
import TelegramLog from "@/lib/telegram-logger";
import { getTurnstile } from "@/lib/turnstile";

export default function EntrarClient() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");

	// Lido do window (e não useSearchParams) para a página continuar estática, sem Suspense.
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (params.has("senha-alterada")) {
			setNotice("Senha alterada. Por segurança, todas as sessões foram encerradas: entre com a nova senha.");
		} else if (params.has("conta-criada")) {
			setNotice("Conta criada! Entre com seu email e senha.");
		}
	}, []);
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [password, setPassword] = useState("");
	const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);

	const { data: session } = useSession();

	const [passwordCriteria, setPasswordCriteria] = useState({
		length: false,
		uppercase: false,
		lowercase: false,
		number: false,
		special: false,
	});

	useEffect(() => {
		if (session?.user?.nickname) {
			router.push(`/${session?.user?.nickname}`);
		}
	}, [session, router]);

	useEffect(() => {
		setPasswordCriteria({
			length: password.length >= 8,
			uppercase: /[A-Z]/.test(password),
			lowercase: /[a-z]/.test(password),
			number: /[0-9]/.test(password),
			special: /[^A-Za-z0-9]/.test(password),
		});
	}, [password]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		let token = null;

		if (process.env.NODE_ENV === "production") {
			token = getTurnstile()?.getResponse();

			if (!token) {
				setError("Por favor, verifique o CAPTCHA.");
				setLoading(false);
				return;
			}
		}

		try {
			const result = await signIn("credentials", {
				redirect: false,
				email,
				password,
				captchaToken: token,
			});

			if (result?.error) {
				if (result.error === AUTH_ERROR.noPassword) {
					setError(
						"Esse usuário não possui senha cadastrada. Logue com sua conta Google e crie uma senha ou resete sua senha.",
					);
				} else if (result.error === AUTH_ERROR.rateLimited) {
					setError("Muitas tentativas de login. Aguarde alguns minutos e tente de novo.");
				} else {
					setError("Email e/ou senha incorretos");
				}
				setLoading(false);
				return;
			}
		} catch (error: any) {
			await TelegramLog.error(`Error entrar.ts: ${error.message}`);
			setError("Ocorreu um erro ao fazer login. Tente novamente.");
		} finally {
			setLoading(false);
			getTurnstile()?.reset();
		}
	};

	const handleGoogleLogin = () => {
		signIn("google", { callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/` });
	};

	const CriteriaItem = ({ met, text }: { met: boolean; text: string }) => (
		<div className="flex items-center space-x-2">
			{met ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
			<span className={`text-sm ${met ? "text-green-500" : "text-gray-400"}`}>{text}</span>
		</div>
	);

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card className="w-full max-w-md border-none">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold dark:text-white">Bem-vindo de volta!</CardTitle>
					<CardDescription className="dark:text-white">Entre na sua conta para continuar</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<Button
						onClick={handleGoogleLogin}
						variant="destructive"
						className="w-full hover:bg-red-500 hover:bg-text-white hover:font-bold dark:bg-white dark:text-black dark:hover:bg-gray-100"
						type="button"
					>
						<svg aria-hidden="true" className="w-5 h-5 mr-3" viewBox="0 0 24 24">
							<path
								fill="currentColor"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="currentColor"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="currentColor"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="currentColor"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						Continuar com Google
					</Button>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<Separator className="w-full" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-white">
								Ou continue com email
							</span>
						</div>
					</div>

					<form onSubmit={handleLogin} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email" className="dark:text-white">
								Email
							</Label>
							<Input
								id="email"
								name="email"
								minLength={12}
								maxLength={32}
								type="email"
								placeholder="seuemail@email.com"
								value={email}
								onChange={(e) => setEmail(e.target.value.toLowerCase().replace(/\s/g, ""))}
								className="dark:text-white"
								required
							/>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="password" className="dark:text-white">
									Senha
								</Label>
								<Link
									href="/esqueci-senha"
									className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
								>
									Esqueci minha senha
								</Link>
							</div>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => {
										const value = e.target.value;
										setPassword(value);
										setShowPasswordCriteria(value.length > 0);
									}}
									className="dark:text-white"
									required
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent dark:text-white"
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4 text-gray-400 dark:text-gray-600" />
									) : (
										<Eye className="h-4 w-4 text-gray-400 dark:text-gray-600" />
									)}
								</Button>
							</div>
							{showPasswordCriteria && (
								<div className="mt-2 p-3 rounded-md">
									<p className="text-sm text-gray-600 mb-2 dark:text-white">Sua senha deve conter:</p>
									<div className="space-y-1">
										<CriteriaItem met={passwordCriteria.length} text="Pelo menos 8 caracteres" />
										<CriteriaItem
											met={passwordCriteria.uppercase}
											text="Pelo menos 1 letra maiúscula (A-Z)"
										/>
										<CriteriaItem
											met={passwordCriteria.lowercase}
											text="Pelo menos 1 letra minúscula (a-z)"
										/>
										<CriteriaItem met={passwordCriteria.number} text="Pelo menos 1 número (0-9)" />
										<CriteriaItem
											met={passwordCriteria.special}
											text="Pelo menos 1 caractere especial (!@#$...)"
										/>
									</div>
								</div>
							)}
						</div>

						<TurnstileWidget />

						{notice && !error && (
							<Alert className="text-center">
								<AlertDescription>{notice}</AlertDescription>
							</Alert>
						)}

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
							className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center dark:bg-white dark:text-black dark:hover:bg-gray-100 text-white"
							disabled={loading}
						>
							{loading ? (
								<>
									<span className="ml-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin dark:border-black dark:border-t-transparent dark:text-white text-white"></span>
									Processando...
								</>
							) : (
								<>
									Entrar
									<ArrowRight className="ml-2 h-5 w-5" />
								</>
							)}
						</Button>
					</form>

					<div className="text-center text-sm text-gray-600 dark:text-white">
						Não tem uma conta?{" "}
						<Link
							href="/criar-conta"
							className="text-blue-600 hover:text-blue-500 font-medium dark:text-blue-400 dark:hover:text-blue-300"
						>
							Cadastre-se Grátis
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
