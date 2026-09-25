import { NextResponse } from "next/server";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const token = searchParams.get("token");

		if (token?.length !== 32) {
			return NextResponse.json({ error: "Token inválido" }, { status: 400 });
		}

		const user = await prisma.user.findFirst({
			where: {
				reset_password_token: token,
				reset_password_token_expires_at: {
					gt: new Date(),
				},
			},
		});

		if (!user) {
			return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
		}

		return NextResponse.json({ success: true, valid: true });
	} catch (error: any) {
		await TelegramLog.error(`Error verifying reset password token: ${error?.message}`);
		return NextResponse.json({ error: "Erro ao verificar token" }, { status: 500 });
	}
}
