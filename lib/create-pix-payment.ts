import TelegramLog from "./telegram-logger";

async function createPixPayment(amount: number, description: string) {
	try {
		const response = await fetch("/api/pix/create", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				amount: amount,
				expiresIn: 600,
				description: description,
				customer: {
					name: "Aleatorio",
					cellphone: "(11) 4002-8922",
					email: "pedrosilva@abacatepay.com",
					taxId: "45672888828",
				},
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			await TelegramLog.error(`Error create-pix-payment.ts createPixPayment: ${JSON.stringify(data?.error)}`);
			throw new Error("Erro ao gerar PIX");
		}

		return data;
	} catch (error: any) {
		await TelegramLog.error(`Error create-pix-payment.ts createPixPayment: ${error.message}`);
		return { error: "Falha ao processar pagamento" };
	}
}
