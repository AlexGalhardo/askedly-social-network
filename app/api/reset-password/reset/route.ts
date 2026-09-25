import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function POST(request: Request) {
	try {
		const { token, password } = await request.json();

		if (token?.length !== 32) {
			return NextResponse.json({ error: "Token inválido" }, { status: 400 });
		}

		const user = await prisma.user.findFirst({
			where: {
				reset_password_token: token,
			},
		});

		if (!user?.reset_password_token_expires_at || user.reset_password_token_expires_at < new Date()) {
			return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
		}

		const hashedPassword = await bcrypt.hash(password, 12);

		await prisma.user.update({
			where: { email: user.email },
			data: {
				password: hashedPassword,
				reset_password_token: null,
				reset_password_token_expires_at: null,
				updated_at: new Date(),
			},
		});

		return NextResponse.json({ success: true });
	} catch (error: any) {
		await TelegramLog.error(`Error resetting password: ${error?.message}`);
		return NextResponse.json({ error: "Erro ao redefinir senha" }, { status: 500 });
	}
}
