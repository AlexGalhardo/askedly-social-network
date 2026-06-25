// /app/[slug]/profile-question-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Clock, Check, Copy, Loader } from "lucide-react";
import { ABACATEPAY_API_KEY } from "../api/pix/create/route";
import TelegramLog from "@/lib/telegram-logger";

const PRESET_AMOUNTS = [2, 5, 10, 20, 50];

interface PaymentModalProps {
	currentStep: "closed" | "payment" | "pix";
	onStepChange: (step: "closed" | "payment" | "pix") => void;
	question: string;
	profile: any;
	session: any;
	update: any;
}

export function ProfilePaymentModal({
	currentStep,
	onStepChange,
	question,
	profile,
	session,
	update,
}: PaymentModalProps) {
	const { toast } = useToast();

	const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
	const [customAmount, setCustomAmount] = useState<string>("");
	const [useCustomAmount, setUseCustomAmount] = useState(false);
	const [isLoadingPayment, setIsLoadingPayment] = useState(false);

	const [isAnonymousNewQuestion, setIsAnonymousNewQuestion] = useState(false);
	const [isPrivateAnswer, setIsPrivateAnswer] = useState(false);
	const [questionAmountPaidIsPrivate, setQuestionAmountPaidIsPrivate] = useState(false);

	const [pixData, setPixData] = useState<any>(null);
	const [copied, setCopied] = useState(false);
	const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID" | "EXPIRED" | "CANCELLED" | "REFUNDED">(
		"PENDING",
	);
	const [timeRemaining, setTimeRemaining] = useState<number>(0);
	const [canClose, setCanClose] = useState(false);
	const [countdownSeconds, setCountdownSeconds] = useState<number>(10);

	useEffect(() => {
		if (!pixData || currentStep !== "pix") return;

		const expiresAt = new Date(pixData.expiresAt);
		const now = new Date();
		const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
		setTimeRemaining(remaining);

		const timer = setInterval(() => {
			setTimeRemaining((prev) => {
				if (prev <= 1) {
					setPaymentStatus("EXPIRED");
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		let statusInterval: ReturnType<typeof setInterval>;

		const checkPaymentStatus = async () => {
			try {
				const response = await fetch(`/api/pix/check?id=${pixData.id}`);
				const result = await response.json();

				if (result.error) return;

				const { status, expiresAt: newExpiresAt } = result;
				setPaymentStatus(status);

				if (status === "PAID") {
					clearInterval(timer);
					clearInterval(statusInterval);
					setTimeout(() => {
						handlePaymentSuccess();
					}, 10000);
				} else if (status === "EXPIRED" || status === "CANCELLED") {
					clearInterval(timer);
					clearInterval(statusInterval);
				}

				if (newExpiresAt) {
					const newExpires = new Date(newExpiresAt);
					const currentTime = new Date();
					const newRemaining = Math.max(0, Math.floor((newExpires.getTime() - currentTime.getTime()) / 1000));
					setTimeRemaining(newRemaining);
				}
			} catch (error: any) {
				await TelegramLog.error(`Erro ao verificar status do pagamento: ${error?.message}`);
			}
		};

		checkPaymentStatus();
		statusInterval = setInterval(checkPaymentStatus, 5000);

		if (process.env.NEXT_PUBLIC_TEST_MODE === "true") {
			setTimeout(() => {
				fetch(`/api/pix/simulate-payment`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ pixId: pixData.id }),
				})
					.then((res) => {
						if (!res.ok) throw new Error("Falha na simulação de pagamento");
					})
					.catch((err) => console.error("Erro na simulação de pagamento:", err));
			}, 5000);
		}

		return () => {
			clearInterval(timer);
			clearInterval(statusInterval);
		};
	}, [pixData, currentStep]);

	useEffect(() => {
		if (paymentStatus === "PAID") {
			setCountdownSeconds(10);
			const countdownTimer = setInterval(() => {
				setCountdownSeconds((prev) => {
					if (prev <= 1) {
						clearInterval(countdownTimer);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);

			const closeTimer = setTimeout(async () => {
				clearInterval(countdownTimer);
				setCanClose(true);
				closeModal();
				await update();
			}, 10000);

			return () => {
				clearInterval(countdownTimer);
				clearTimeout(closeTimer);
			};
		}

		if (paymentStatus !== "PENDING") {
			setCanClose(true);
		} else {
			setCanClose(false);
		}
	}, [paymentStatus, update]);

	const isGenerateButtonEnabled =
		(useCustomAmount && customAmount && Number.parseFloat(customAmount) >= 2) ||
		(!useCustomAmount && selectedAmount !== null && selectedAmount > 0);

	const handleOpenChangeModal = (isOpen: boolean) => {
		if (!isOpen && canClose) {
			closeModal();
		}
	};

	const handleCustomAmountChange = (value: string) => {
		const sanitizedValue = value.replace(/[^0-9.]/g, "");

		const parts = sanitizedValue.split(".");
		if (parts.length > 2) {
			return;
		}

		if (parts[1] && parts[1].length > 2) {
			return;
		}

		setCustomAmount(sanitizedValue);

		const numValue = Number.parseFloat(sanitizedValue);
		if (!isNaN(numValue) && numValue >= 2) {
			setSelectedAmount(numValue);
		} else {
			setSelectedAmount(0);
		}
	};

	const handlePresetAmountClick = (amount: number) => {
		if (!useCustomAmount) {
			setCustomAmount("");
			setSelectedAmount(amount);
		}
	};

	const handleCustomAmountClick = () => {
		setUseCustomAmount(true);
		setSelectedAmount(0);
	};

	const handleGeneratePix = async () => {
		if (!selectedAmount) return;

		setIsLoadingPayment(true);
		try {
			const response = await fetch("/api/pix/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					amount: selectedAmount * 100,
					nickname: profile.nickname,
					question_text: question,
				}),
			});

			const result = await response.json();

			if (result.error) {
				toast({
					title: `Erro ao gerar PIX`,
					description: "Tente novamente mais tarde",
					variant: "error",
				});
				return;
			}

			setPixData(result);
			setPaymentStatus("PENDING");
			onStepChange("pix");
		} catch (error: any) {
			await TelegramLog.error(`Erro ao gerar PIX: ${error?.message}`);
			toast({
				title: "Erro ao gerar PIX",
				description: error?.message ?? "Não foi possível gerar o código PIX. Tente novamente.",
				variant: "error",
			});
		} finally {
			setIsLoadingPayment(false);
		}
	};

	const handlePaymentSuccess = async () => {
		try {
			const questionData = {
				question_text: question,
				amount_paid: (selectedAmount ?? 0) * 100,
				is_anonymous: isAnonymousNewQuestion,
				asker_want_answer_to_be_private: isPrivateAnswer,
				amount_paid_is_private: questionAmountPaidIsPrivate,
				pix_id: pixData?.id,
				owner_user_id: profile.id,
				asker_id: session?.user?.id,
			};

			const response = await fetch("/api/question/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(questionData),
			});

			const result = await response.json();

			if (!response.ok || result.error) {
				toast({
					title: "Erro ao enviar pergunta",
					description: result?.error ?? "Houve um erro ao enviar sua pergunta.",
					variant: "error",
				});
				return;
			}

			toast({
				title: "Pagamento confirmado!",
				description: "Sua pergunta foi enviada com sucesso.",
				variant: "success",
			});

			onStepChange("closed");
		} catch (error: any) {
			TelegramLog.error(`Erro ao enviar pergunta: ${error?.message}`);
			toast({
				title: "Erro ao enviar pergunta",
				description: error?.message ?? "Houve um erro ao enviar sua pergunta.",
				variant: "error",
			});
		}
	};

	const handleCopyCode = () => {
		if (pixData?.brCode) {
			navigator.clipboard.writeText(pixData.brCode);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	const getStatusColor = () => {
		switch (paymentStatus) {
			case "PAID":
				return "text-green-600";
			case "EXPIRED":
				return "text-red-600";
			case "CANCELLED":
				return "text-gray-600";
			case "REFUNDED":
				return "text-blue-600";
			default:
				return "text-orange-600";
		}
	};

	const getStatusText = () => {
		switch (paymentStatus) {
			case "PAID":
				return "Pagamento confirmado!";
			case "EXPIRED":
				return "PIX expirado";
			case "CANCELLED":
				return "PIX cancelado";
			case "REFUNDED":
				return "PIX reembolsado";
			default:
				return "Aguardando pagamento...";
		}
	};

	const closeModal = () => {
		onStepChange("closed");
	};

	return (
		<>
			<Dialog open={currentStep === "payment"} onOpenChange={closeModal}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-center text-xl">
							Quanto você quer pagar para fazer essa pergunta?
						</DialogTitle>
					</DialogHeader>

					<div className="py-4">
						<div className="flex items-center justify-between mb-6 p-4 rounded-lg bg-gray-100 text-gray-900 dark:bg-neutral-900 dark:text-neutral-100">
							{!profile?.privacy_accept_anonymous_questions ? (
								<span className="text-sm text-gray-500 dark:text-gray-400">
									Esse perfil não aceita perguntas anônimas
								</span>
							) : session?.user?.anonymous_questions_remaining_today === 0 ? (
								<span className="text-sm text-gray-500 dark:text-gray-400">
									{session?.user?.anonymous_questions_remaining_today} perguntas anônimas restantes
									hoje
								</span>
							) : (
								<>
									<div className="space-y-0.5">
										<Label className="text-sm font-medium">Enviar pergunta anonimamente?</Label>
										<p className="text-sm text-gray-500 dark:text-gray-400">
											Sua identidade não será revelada
										</p>
									</div>
									<Switch
										checked={isAnonymousNewQuestion}
										onCheckedChange={setIsAnonymousNewQuestion}
										className="data-[state=checked]:bg-green-500 dark:data-[state=checked]:bg-green-400"
									/>
								</>
							)}
						</div>

						<div className="flex items-center justify-between mb-6 p-4 rounded-lg bg-gray-100 text-gray-900 dark:bg-neutral-900 dark:text-neutral-100">
							<div className="space-y-0.5">
								<Label className="text-sm font-medium">Quero que a resposta seja privada</Label>
								<p className="text-sm text-gray-500 dark:text-gray-400">
									A resposta não será mostrada publicamente
								</p>
							</div>
							<Switch
								checked={isPrivateAnswer}
								onCheckedChange={setIsPrivateAnswer}
								className="data-[state=checked]:bg-blue-500 dark:data-[state=checked]:bg-blue-400"
							/>
						</div>

						<div className="flex items-center justify-between mb-6 p-4 rounded-lg bg-gray-100 text-gray-900 dark:bg-neutral-900 dark:text-neutral-100">
							<div className="space-y-0.5">
								<Label className="text-sm font-medium">
									Não quero que o valor que paguei nessa pergunta seja público
								</Label>
								<p className="text-sm text-gray-500 dark:text-gray-400">
									O valor que você pagou por fazer essa pergunta não será mostrado publicamente
								</p>
							</div>
							<Switch
								checked={questionAmountPaidIsPrivate}
								onCheckedChange={setQuestionAmountPaidIsPrivate}
								className="data-[state=checked]:bg-purple-500 dark:data-[state=checked]:bg-purple-400"
							/>
						</div>

						<div className="grid grid-cols-3 gap-2 mb-6">
							{PRESET_AMOUNTS.map((amount) => (
								<Button
									key={amount}
									variant={!useCustomAmount && selectedAmount === amount ? "default" : "outline"}
									onClick={() => handlePresetAmountClick(amount)}
									disabled={useCustomAmount}
									className="h-16 text-lg"
								>
									{formatCurrency(amount * 100)}
								</Button>
							))}

							<Button
								variant={useCustomAmount ? "default" : "outline"}
								onClick={handleCustomAmountClick}
								className="h-16 text-lg"
							>
								Outro
							</Button>
						</div>

						{useCustomAmount && (
							<div className="space-y-2 mb-6">
								<Label htmlFor="custom-amount">Digite o valor</Label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2">R$</span>
									<Input
										id="custom-amount"
										value={customAmount}
										onChange={(e) => handleCustomAmountChange(e.target.value)}
										className="pl-10"
										placeholder="0,00"
										autoFocus
									/>
								</div>
							</div>
						)}

						<Button
							onClick={handleGeneratePix}
							disabled={!isGenerateButtonEnabled || isLoadingPayment}
							className="w-full flex items-center justify-center gap-2 bg-green-500 text-white dark:hover:bg-green-800"
						>
							{isLoadingPayment ? (
								<>
									<Loader className="h-4 w-4 animate-spin" />
									Gerando PIX...
								</>
							) : (
								"Gerar PIX para Pagar"
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={currentStep === "pix"} onOpenChange={handleOpenChangeModal}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="text-center text-xl text-green-500">
							{paymentStatus === "PAID" ? "Pagamento Confirmado!" : "Pague com PIX"}
						</DialogTitle>
					</DialogHeader>

					<div className="py-4 flex flex-col items-center">
						{paymentStatus === "PAID" ? (
							<div className="flex flex-col items-center space-y-4">
								<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
									<Check className="w-8 h-8 text-green-600" />
								</div>
								<p className="text-orange-500 text-center">Sua pergunta foi enviada com sucesso!</p>
								<p className="text-gray-600 text-center dark:text-white">
									Esse modal se fechará automaticamente em {countdownSeconds} segundos.
								</p>
							</div>
						) : (
							<>
								<div className="bg-white p-4 rounded-lg mb-4 w-64 h-64 flex items-center justify-center border">
									{pixData?.brCodeBase64 ? (
										<img src={pixData.brCodeBase64} alt="QR Code PIX" width={240} height={240} />
									) : (
										<div className="bg-gray-200 w-full h-full flex items-center justify-center">
											<span className="text-gray-500">QR Code PIX</span>
										</div>
									)}
								</div>

								<div className="w-full space-y-4">
									<div className="flex items-center justify-center space-x-2">
										<Clock className="w-4 h-4 text-orange-600" />
										<span className={`font-semibold ${getStatusColor()}`}>{getStatusText()}</span>
									</div>

									<div className="text-center">
										<p className="text-sm text-gray-600 dark:text-white">
											Valor a Pagar: {formatCurrency((selectedAmount ?? 0) * 100)}
										</p>
									</div>

									{paymentStatus === "PENDING" && (
										<div className="text-center">
											<p className="text-sm text-gray-600 dark:text-red-500">
												Tempo restante:{" "}
												<span className="font-bold">{formatTime(timeRemaining)}</span>
											</p>
										</div>
									)}

									{paymentStatus === "PENDING" && (
										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												className="flex-1 flex items-center justify-center gap-2"
												onClick={handleCopyCode}
											>
												{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
												{copied ? "Copiado!" : "Copiar código PIX"}
											</Button>
										</div>
									)}

									{paymentStatus === "PENDING" && (
										<p className="text-sm text-center text-muted-foreground dark:text-white">
											Escaneie o QR code ou copie o código PIX para pagar.
										</p>
									)}

									{process.env.NEXT_PUBLIC_TEST_MODE === "true" && (
										<p className="text-sm text-center text-muted-foreground">
											Você está em teste mode. Esse PIX será pago automaticamente em alguns
											segundos.
										</p>
									)}

									{(paymentStatus === "EXPIRED" || paymentStatus === "CANCELLED") && (
										<Button variant="destructive" className="w-full" onClick={closeModal}>
											Fechar e tentar novamente
										</Button>
									)}
								</div>
							</>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
