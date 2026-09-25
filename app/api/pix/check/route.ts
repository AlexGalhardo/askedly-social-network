import { NextResponse } from "next/server";
import { ABACATEPAY_API_KEY } from "@/lib/abacatepay";
import TelegramLog from "@/lib/telegram-logger";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const pixId = searchParams.get("id");

		if (!pixId) {
			return NextResponse.json({ error: "ID do pagamento não fornecido." }, { status: 400 });
		}

		const response = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?id=${pixId}`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
				"Content-Type": "application/json",
			},
		});

		const data = await response.json();

		if (data.error) {
			await TelegramLog.error(`ERRO ao verificar status PIX: ${JSON.stringify(data.error)}`);
			return NextResponse.json({ error: data.error }, { status: 500 });
		}

		if (data.data) {
			if (data.data.status === "PAID")
				await TelegramLog.info(`STATUS PIX PAID VERIFICADO NA ABACATEPAY: \n\n${JSON.stringify(data.data)}`);
			return NextResponse.json(data.data);
		}

		return NextResponse.json({ error: "Resposta inesperada da API" }, { status: 500 });
	} catch (error: any) {
		await TelegramLog.error(`Catch ERRO ao verificar status PIX: ${error?.message}`);
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	}
}
