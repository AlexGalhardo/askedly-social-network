import { NextResponse } from "next/server";
import { ResetPasswordEmail } from "@/emails/reset-password-email";
import { EMAIL_FROM, resendClient } from "@/lib/email";
import { clientIp } from "@/lib/request-ip";
import { createPasswordResetToken } from "@/lib/services/password-reset.service";
import { consumeRateLimit, RATE_LIMITS, rateLimitMessage } from "@/lib/services/rate-limit.service";
import TelegramLog from "@/lib/telegram-logger";

export async function POST(request: Request) {
	try {
		const limit = await consumeRateLimit(
			`password-reset:ip:${clientIp(request.headers)}`,
			RATE_LIMITS.passwordReset,
		);
		if (!limit.allowed) {
			return NextResponse.json({ error: rateLimitMessage(limit.retryAfterSeconds) }, { status: 429 });
		}

		const { email } = await request.json();
		if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
			return NextResponse.json({ error: "Email inválido" }, { status: 400 });
		}

		// Mesma resposta com ou sem conta: a rota não pode servir para descobrir quais emails estão cadastrados.
		const reset = await createPasswordResetToken(email);
		if (!reset) return NextResponse.json({ success: true });

		const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/alterar-senha?token=${reset.token}`;
		const { error } = await resendClient().emails.send({
			from: EMAIL_FROM,
			to: email,
			subject: "Crie Sua Nova Senha - Respondeae.com.br",
			react: ResetPasswordEmail({ name: reset.name, resetLink }),
		});
		if (error) await TelegramLog.error(`Reset de senha: falha ao enviar email: ${error.message}`);

		return NextResponse.json({ success: true });
	} catch (error: unknown) {
		await TelegramLog.error(`Reset de senha (request): ${error instanceof Error ? error.message : error}`);
		return NextResponse.json({ error: "Erro ao processar solicitação de recuperação de senha" }, { status: 500 });
	}
}
