import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

// "login:email:fulano@x.com" → "login:email:f***@x.com": o alerta vai para o Telegram.
export function maskEmail(key: string): string {
	return key.replace(/([^:@]+)(@[^:]+)$/, (_, user: string, domain: string) => `${user.charAt(0)}***${domain}`);
}

export interface RateLimitRule {
	limit: number;
	windowMs: number;
}

const MINUTE = 60_000;

export const RATE_LIMITS = {
	login: { limit: 10, windowMs: 15 * MINUTE },
	signup: { limit: 5, windowMs: 60 * MINUTE },
	contact: { limit: 5, windowMs: 60 * MINUTE },
	passwordReset: { limit: 5, windowMs: 60 * MINUTE },
	passwordChange: { limit: 10, windowMs: 15 * MINUTE },
} satisfies Record<string, RateLimitRule>;

export interface RateLimitResult {
	allowed: boolean;
	retryAfterSeconds: number;
}

/**
 * Janela fixa em Postgres, compartilhada por todas as instâncias serverless. O upsert conta e reinicia a janela
 * numa única instrução, então requisições simultâneas não passam do limite.
 */
export async function consumeRateLimit(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
	// SQLite só existe no dev local (setups/*-sqlite.sh); ali não há o que proteger.
	if (process.env.DATABASE_URL?.startsWith("file:")) return { allowed: true, retryAfterSeconds: 0 };

	const now = new Date();
	const resetAt = new Date(now.getTime() + rule.windowMs);
	const [row] = await prisma.$queryRaw<{ count: number; reset_at: Date }[]>`
		INSERT INTO rate_limits (key, count, reset_at) VALUES (${key}, 1, ${resetAt})
		ON CONFLICT (key) DO UPDATE SET
			count = CASE WHEN rate_limits.reset_at <= ${now} THEN 1 ELSE rate_limits.count + 1 END,
			reset_at = CASE WHEN rate_limits.reset_at <= ${now} THEN ${resetAt} ELSE rate_limits.reset_at END
		RETURNING count, reset_at`;

	// Alerta só na primeira requisição acima do limite em cada janela, para um ataque não virar enxurrada de mensagens.
	if (row.count === rule.limit + 1) {
		await TelegramLog.warning(
			`🚦 Rate limit atingido: ${maskEmail(key)} (${rule.limit} em ${rule.windowMs / 60_000} min)`,
		);
	}

	return {
		allowed: row.count <= rule.limit,
		retryAfterSeconds: Math.max(0, Math.ceil((row.reset_at.getTime() - now.getTime()) / 1000)),
	};
}

/** Só consulta, sem gastar a cota: para limites que contam apenas falhas (ver login em lib/auth.ts). */
export async function isRateLimited(key: string, rule: RateLimitRule): Promise<boolean> {
	if (process.env.DATABASE_URL?.startsWith("file:")) return false;
	const row = await prisma.rateLimit.findUnique({ where: { key } });
	return !!row && row.reset_at > new Date() && row.count >= rule.limit;
}

export async function clearRateLimit(key: string): Promise<void> {
	if (process.env.DATABASE_URL?.startsWith("file:")) return;
	await prisma.rateLimit.deleteMany({ where: { key } });
}

export async function deleteExpiredRateLimits(): Promise<number> {
	const { count } = await prisma.rateLimit.deleteMany({ where: { reset_at: { lt: new Date() } } });
	return count;
}

export function rateLimitMessage(retryAfterSeconds: number): string {
	const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
	return `Muitas tentativas. Tente de novo em ${minutes} minuto${minutes > 1 ? "s" : ""}.`;
}
