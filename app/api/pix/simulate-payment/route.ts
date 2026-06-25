import TelegramLog from "@/lib/telegram-logger";
import { NextResponse } from "next/server";
import { ABACATEPAY_API_KEY } from "../create/route";

export async function POST(request: Request) {
	try {
		const { pixId } = await request.json();

		if (!pixId) return NextResponse.json({ error: "Pix id não enviado" }, { status: 400 });

		const response = await fetch(`https://api.abacatepay.com/v1/pixQrCode/simulate-payment?id=${pixId}`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				metadata: {
					testMode: process.env.TEST_MODE,
				},
			}),
		});

		const data = await response.json();

		if (data.error) {
			await TelegramLog.error(`ERRO ao simular pagamento de PIX: ${JSON.stringify(data?.error)}`);
			return NextResponse.json({ error: data.error }, { status: 500 });
		}

		if (data.data) return NextResponse.json(data.data);

		return NextResponse.json({ error: "Resposta inesperada da API" }, { status: 500 });
	} catch (error: any) {
		await TelegramLog.error(`Catch ERRO ao gerar PIX para pagar: ${error?.message}`);
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	}
}
