import { NextResponse } from "next/server";
import { ABACATEPAY_API_KEY } from "@/lib/abacatepay";
import TelegramLog from "@/lib/telegram-logger";

export async function POST(request: Request) {
	try {
		const { amount, nickname, question_text } = await request.json();

		if (!amount || amount < 200) {
			return NextResponse.json({ error: "O valor mínimo é R$ 2,00 reais" }, { status: 400 });
		}

		const response = await fetch("https://api.abacatepay.com/v1/pixQrCode/create", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				amount,
				expiresIn: 600,
				description: `Respondeae: Enviar pergunta a @${nickname}: ${question_text}`,
			}),
		});

		const data = await response.json();

		if (data.error) {
			await TelegramLog.error(`ERRO ao gerar PIX para pagar: ${JSON.stringify(data?.error)}`);
			return NextResponse.json({ error: data.error }, { status: 500 });
		}

		if (data.data) {
			return NextResponse.json(data.data);
		}

		return NextResponse.json({ error: "Resposta inesperada da API" }, { status: 500 });
	} catch (error: any) {
		await TelegramLog.error(`Catch ERRO ao gerar PIX para pagar: ${error?.message}`);
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	}
}
