"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, getUserByEmail, getUserByNickname } from "@/lib/repositories/users.repository";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import Script from "next/script";
import TelegramLog from "@/lib/telegram-logger";

const schemaUserSignup = z.object({
	name: z.string().min(4, "Nome deve ter pelo menos 4 letras").max(32, "Nome deve ter no máximo 32 caracters"),
	nickname: z
		.string()
		.min(4, "Nickname deve ter pelo menos 4 letras")
		.max(16, "Nickname deve ter no máximo 16 letras")
		.regex(/^[a-zA-Z0-9_]+$/, "Nickname não pode conter caracteres especiais (exceto _)"),
	email: z.string().email("Email deve ser válido"),
	password: z
		.string()
		.min(8, "Senha deve ter pelo menos 8 caracteres")
		.regex(/(?=.*[a-z])/, "Senha deve conter pelo menos 1 letra minúscula")
		.regex(/(?=.*[A-Z])/, "Senha deve conter pelo menos 1 letra maiúscula")
		.regex(/(?=.*\d)/, "Senha deve conter pelo menos 1 número")
		.regex(/(?=.*[!@#$%^&*(),.?":{}|<>])/, "Senha deve conter pelo menos 1 caractere especial"),
	acceptTerms: z
		.boolean()
		.refine((val) => val === true, "Você deve aceitar os termos de uso e política de privacidade"),
});

export default function CriarContaClient() {
	const { data: session } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (session && session?.user?.nickname) router.push("/feed");
	}, [session]);

	const [name, setName] = useState("");
	const [nickname, setNickname] = useState("");
	const [email, setEmail] = useState("");
	const [acceptTerms, setAcceptTerms] = useState(false);
	const [error, setError] = useState("");
	const [errorEmail, setErrorEmail] = useState("");
	const [errorNickname, setErrorNickname] = useState("");
	const [errorName, setErrorName] = useState("");
	const [errorPassword, setErrorPassword] = useState("");
	const [errorTerms, setErrorTerms] = useState("");
	const [loading, setLoading] = useState(false);
	const [accountCreated, setAccountCreated] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [password, setPassword] = useState("");
	const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);

	const handleSignup = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setErrorEmail("");
		setErrorNickname("");
		setErrorName("");
		setErrorPassword("");
		setErrorTerms("");
		setLoading(true);

		try {
			schemaUserSignup.parse({
				name: name.trim(),
				nickname: nickname.trim(),
				email: email.trim(),
				password,
				acceptTerms,
			});
		} catch (err) {
			await TelegramLog.error(`Error criar-conta.ts: ${err}`);
			if (err instanceof z.ZodError) {
				err.errors.forEach((error) => {
					const path = error.path[0];
					switch (path) {
						case "name":
							setErrorName(error.message);
							break;
						case "nickname":
							setErrorNickname(error.message);
							break;
						case "email":
							setErrorEmail(error.message);
							break;
						case "password":
							setErrorPassword(error.message);
							break;
						case "acceptTerms":
							setErrorTerms(error.message);
							break;
					}
				});
			}
			setLoading(false);
			return;
		}

		let token = null;

		if (process.env.NEXT_PUBLIC_NODE_ENV === "production") {
			token = (window as any).turnstile?.getResponse?.();

			if (!token) {
				setError("Por favor, verifique o CAPTCHA.");
				setLoading(false);
				return;
			}
		}

		try {
			const existingUserNickname = await getUserByNickname(nickname);

			if (existingUserNickname) {
				setErrorNickname(`Esse @${nickname} está indisponível`);
				setLoading(false);
				return;
			}

			const existingUserEmail = await getUserByEmail(email);

			if (existingUserEmail) {
				setErrorEmail("Esse Email está indisponível");
				setLoading(false);
				return;
			}

			await createUser(name, nickname, email, password);

			const result = await signIn("credentials", {
				redirect: false,
				email,
				password,
				captchaToken: token,
			});

			if (result?.error) {
				setError("Ocorreu algum erro ao criar conta. Tente novamente mais tarde.");
				setLoading(false);
				return;
			} else {
				setAccountCreated(true);
				router.push("/minha-conta");
			}
		} catch (err: any) {
			await TelegramLog.error(`Catch Error file criar-conta.ts handleSignup: ${err?.message}`);
			setError("Ocorreu algum erro ao criar conta. Tente novamente mais tarde.");
		} finally {
			setLoading(false);
			(window as any).turnstile?.reset();
		}
	};

	const handleGoogleSignup = async () => {
		signIn("google", { callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/` });
	};

	useEffect(() => {
		if (password.length > 0) {
			setPasswordCriteria({
				length: password.length >= 8,
				uppercase: /[A-Z]/.test(password),
				lowercase: /[a-z]/.test(password),
				number: /[0-9]/.test(password),
				special: /[^A-Za-z0-9]/.test(password),
			});
		} else {
			setPasswordCriteria({
				length: false,
				uppercase: false,
				lowercase: false,
				number: false,
				special: false,
			});
		}
	}, [password]);

	const [passwordCriteria, setPasswordCriteria] = useState({
		length: false,
		uppercase: false,
		lowercase: false,
		number: false,
		special: false,
	});

	const CriteriaItem = ({ met, text }: { met: boolean; text: string }) => (
		<div className="flex items-center space-x-2">
			{met ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
			<span className={`text-sm ${met ? "text-green-500" : "text-gray-400"}`}>{text}</span>
		</div>
	);

	const turnstileRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if ((window as any).turnstile && turnstileRef.current) {
			(window as any).turnstile.render(turnstileRef.current, {
				sitekey: "0x4AAAAAABiCEoK5rM8dg1Xm",
				callback: function (token: string) {},
			});
		}
	}, []);

	return (
		<>
			<Script
				src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback"
				async
				defer
				onLoad={() => console.log("Turnstile script carregado")}
			/>
			<div className="min-h-screen flex items-center justify-center p-4">
				<Card className="w-full max-w-md border-none">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl font-bold dark:text-white">Crie Sua Conta</CardTitle>
						<CardDescription className="dark:text-white">Preencha as informações abaixo</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<Button
							onClick={handleGoogleSignup}
							variant="destructive"
							className="w-full hover:bg-red-500 hover:bg-text-white hover:font-bold dark:bg-white dark:text-black dark:hover:bg-gray-100"
							type="button"
						>
							<svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
							Criar Conta Com Google
						</Button>

						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<Separator className="w-full" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-white">
									Ou cadastre-se com email
								</span>
							</div>
						</div>

						<form onSubmit={handleSignup} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name" className="dark:text-white">
									Nome da Conta
								</Label>
								<Input
									id="name"
									type="text"
									maxLength={32}
									minLength={4}
									placeholder="Digite o nome da conta"
									value={name}
									onChange={(e) => {
										const capitalizedName = e.target.value
											.split(" ")
											.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
											.join(" ");
										setName(capitalizedName);
									}}
									className="dark:text-white"
									required
								/>
								{errorName && <p className="font-bold text-red-600">{errorName}</p>}
							</div>

							<div className="space-y-2">
								<Label htmlFor="nickname" className="dark:text-white">
									O @ será{" "}
									<small className="text-gray-400 dark:text-gray-300">
										(você não poderá mudar depois)
									</small>
								</Label>
								<div className="">
									<Input
										id="nickname"
										type="text"
										maxLength={32}
										minLength={4}
										placeholder="mynickname"
										value={`@${nickname}`}
										onChange={(e) => {
											const rawValue = e.target.value;
											const sanitizedValue = rawValue.toLowerCase().replace(/[^a-z]/g, "");
											setNickname(sanitizedValue);
										}}
										className="dark:text-white"
										required
									/>
									{errorNickname && <p className="font-bold text-red-600">{errorNickname}</p>}
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email" className="dark:text-white">
									Email{" "}
									<small className="text-gray-400 dark:text-gray-300">
										(você não poderá mudar depois)
									</small>
								</Label>
								<Input
									id="email"
									type="email"
									name="email"
									minLength={12}
									maxLength={32}
									placeholder="seuemail@email.com"
									value={email}
									onChange={(e) => setEmail(e.target.value.toLowerCase().replace(/\s/g, ""))}
									className="dark:text-white"
									required
								/>
								{errorEmail && <p className="font-bold text-red-600">{errorEmail}</p>}
							</div>

							<div className="space-y-2">
								<Label htmlFor="password" className="dark:text-white">
									Senha
								</Label>
								<div className="relative">
									<Input
										id="password"
										type={showPassword ? "text" : "password"}
										value={password}
										minLength={8}
										maxLength={32}
										onChange={(e) => {
											const value = e.target.value;
											setPassword(value);
											setShowPasswordCriteria(value.length > 0);
										}}
										className="dark:text-white"
										required
									/>
									{errorPassword && <p className="font-bold text-red-600">{errorPassword}</p>}
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
										<p className="text-sm text-gray-600 mb-2 dark:text-white">
											Sua senha deve conter:
										</p>
										<div className="space-y-1">
											<CriteriaItem
												met={passwordCriteria.length}
												text="Pelo menos 8 caracteres"
											/>
											<CriteriaItem
												met={passwordCriteria.uppercase}
												text="Pelo menos 1 letra maiúscula (A-Z)"
											/>
											<CriteriaItem
												met={passwordCriteria.lowercase}
												text="Pelo menos 1 letra minúscula (a-z)"
											/>
											<CriteriaItem
												met={passwordCriteria.number}
												text="Pelo menos 1 número (0-9)"
											/>
											<CriteriaItem
												met={passwordCriteria.special}
												text="Pelo menos 1 caractere especial (!@#$...)"
											/>
										</div>
									</div>
								)}
							</div>

							<div className="space-y-2">
								<div className="flex items-center space-x-2">
									<Checkbox id="terms" onCheckedChange={(checked) => setAcceptTerms(!!checked)} />
									<Label htmlFor="terms" className="text-sm text-gray-600 dark:text-white">
										Aceito os{" "}
										<Link
											href="/termos-de-uso"
											target="_blank"
											className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
										>
											Termos de Uso
										</Link>{" "}
										e{" "}
										<Link
											href="/politica-de-privacidade"
											target="_blank"
											className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
										>
											Política de Privacidade
										</Link>
									</Label>
								</div>
								{errorTerms && <p className="font-bold text-red-600">{errorTerms}</p>}
							</div>

							<div className="w-full" ref={turnstileRef}></div>

							{error && error !== "Callback" && <p className="font-bold text-red-600">{error}</p>}

							<Button
								type="submit"
								className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center dark:bg-white dark:text-black dark:hover:bg-gray-100 text-white"
								disabled={loading}
							>
								{loading ? (
									<>
										<span className="ml-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin dark:border-black dark:border-t-transparent"></span>
										Processando...
									</>
								) : (
									<>
										Criar Conta Gratuitamente
										<ArrowRight className="ml-2 h-5 w-5" />
									</>
								)}
							</Button>

							{accountCreated && (
								<p className="font-bold text-center text-green-600">Conta criada! Redirecionando...</p>
							)}
						</form>

						<div className="text-center text-sm text-gray-600 dark:text-white">
							Já tem uma conta?{" "}
							<Link
								href="/entrar"
								className="text-blue-600 hover:text-blue-500 font-medium dark:text-blue-400 dark:hover:text-blue-300"
							>
								Entrar
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
