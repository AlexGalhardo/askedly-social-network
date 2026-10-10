import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

// "login:email:john@x.com" → "login:email:j***@x.com": the alert goes to Telegram.
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
	creditsCheckout: { limit: 20, windowMs: 60 * MINUTE },
} satisfies Record<string, RateLimitRule>;

export interface RateLimitResult {
	allowed: boolean;
	retryAfterSeconds: number;
}

/**
 * Fixed window in Postgres, shared by every serverless instance. The upsert counts and restarts the window
 * in a single statement, so simultaneous requests do not exceed the limit.
 */
export async function consumeRateLimit(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
	// SQLite only exists in local dev (setups/*-sqlite.sh); there is nothing to protect there.
	if (process.env.DATABASE_URL?.startsWith("file:")) return { allowed: true, retryAfterSeconds: 0 };

	const now = new Date();
	const resetAt = new Date(now.getTime() + rule.windowMs);
	const [row] = await prisma.$queryRaw<{ count: number; reset_at: Date }[]>`
		INSERT INTO rate_limits (key, count, reset_at) VALUES (${key}, 1, ${resetAt})
		ON CONFLICT (key) DO UPDATE SET
			count = CASE WHEN rate_limits.reset_at <= ${now} THEN 1 ELSE rate_limits.count + 1 END,
			reset_at = CASE WHEN rate_limits.reset_at <= ${now} THEN ${resetAt} ELSE rate_limits.reset_at END
		RETURNING count, reset_at`;

	// Alert only on the first request above the limit in each window, so an attack does not become a flood of messages.
	if (row.count === rule.limit + 1) {
		await TelegramLog.warning(
			`🚦 Rate limit reached: ${maskEmail(key)} (${rule.limit} in ${rule.windowMs / 60_000} min)`,
		);
	}

	return {
		allowed: row.count <= rule.limit,
		retryAfterSeconds: Math.max(0, Math.ceil((row.reset_at.getTime() - now.getTime()) / 1000)),
	};
}

/** Only checks, without spending the quota: for limits that count only failures (see login in lib/auth.ts). */
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

/** Minutes until it can be tried again, for the translated `errors.rateLimited` message. */
export function rateLimitMinutes(retryAfterSeconds: number): number {
	return Math.max(1, Math.ceil(retryAfterSeconds / 60));
}

export function rateLimitMessage(retryAfterSeconds: number): string {
	const minutes = rateLimitMinutes(retryAfterSeconds);
	return `Too many attempts. Try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`;
}
