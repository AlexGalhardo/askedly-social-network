import TelegramLog from "./telegram-logger";
import { TURNSTILE_ENABLED } from "./turnstile";

// Falha fechada: se a Cloudflare não responder, a requisição não passa sem captcha.
export async function isCaptchaValid(token: string | undefined): Promise<boolean> {
	// Captcha só vale com as duas chaves: sem a site key o frontend não mostra o widget e não há token para conferir.
	// Não configurado = recurso desligado. Configurado, falha fechado.
	if (!TURNSTILE_ENABLED || !process.env.CLOUDFLARE_TURNSTILE_SECRET) return true;
	if (!token) return false;
	try {
		const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({ secret: process.env.CLOUDFLARE_TURNSTILE_SECRET ?? "", response: token }),
		});
		const data: { success?: boolean } = await res.json();
		return data.success === true;
	} catch (error: unknown) {
		await TelegramLog.error(`Erro ao validar captcha: ${error instanceof Error ? error.message : error}`);
		return false;
	}
}
