import { NextResponse } from "next/server";
import { Resend } from "resend";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/prisma/prisma-client";
import { ResetPasswordEmail } from "@/emails/reset-password-email";
import TelegramLog from "@/lib/telegram-logger";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
	try {
		const { email } = await request.json();

		if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
			return NextResponse.json({ error: "Email inválido" }, { status: 400 });
		}

		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return NextResponse.json({ success: true });
		}

		const token = uuidv4().replace(/-/g, "");
		const expiresAt = new Date();
		expiresAt.setHours(expiresAt.getHours() + 1);

		await prisma.user.update({
			where: { email },
			data: {
				reset_password_token: token,
				reset_password_token_expires_at: expiresAt,
			},
		});

		const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/alterar-senha?token=${token}`;

		await resend.emails.send({
			from: "onboarding@resend.dev",
			to: "aleexgvieira@gmail.com", //[email]
			subject: "Crie Sua Nova Senha - Respondeae.com.br",
			react: ResetPasswordEmail({ name: user.name, resetLink }),
		});

		return NextResponse.json({ success: true });
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file reset-password-actions.ts request: ${error?.message}`);
		return NextResponse.json({ error: "Erro ao processar solicitação de recuperação de senha" }, { status: 500 });
	}
}
