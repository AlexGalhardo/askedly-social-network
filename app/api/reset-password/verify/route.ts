import { NextResponse } from "next/server";
import { isResetTokenValid } from "@/lib/services/password-reset.service";
import TelegramLog from "@/lib/telegram-logger";

export async function GET(request: Request) {
	try {
		const token = new URL(request.url).searchParams.get("token");
		if (token?.length !== 32 || !(await isResetTokenValid(token))) {
			return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
		}
		return NextResponse.json({ success: true, valid: true });
	} catch (error: unknown) {
		await TelegramLog.error(`Reset de senha (verify): ${error instanceof Error ? error.message : error}`);
		return NextResponse.json({ error: "Erro ao verificar token" }, { status: 500 });
	}
}
