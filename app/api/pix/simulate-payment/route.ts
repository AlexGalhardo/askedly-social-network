import { NextResponse } from "next/server";
import { simulatePixPayment } from "@/lib/abacatepay";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function POST(request: Request) {
	// Simular pagamento só existe no modo de teste (chave sandbox); em produção marcaria um PIX como pago sem dinheiro.
	if (process.env.NEXT_PUBLIC_TEST_MODE !== "true") return NextResponse.json({ error: "Not found" }, { status: 404 });

	try {
		const user = await getSessionUser();
		if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

		const { pixId } = await request.json();
		if (typeof pixId !== "string") return NextResponse.json({ error: "Pix id não enviado" }, { status: 400 });

		const charge = await prisma.webhookAbacatePay.findUnique({
			where: { pix_id: pixId },
			select: { userId: true },
		});
		if (charge?.userId !== user.id)
			return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 });

		return NextResponse.json(await simulatePixPayment(pixId));
	} catch (error: unknown) {
		await TelegramLog.error(`Catch ERRO ao simular pagamento PIX: ${(error as Error)?.message}`);
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	}
}
