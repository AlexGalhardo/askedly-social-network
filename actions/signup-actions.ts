"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { isCaptchaValid } from "@/lib/captcha";
import { clientIp } from "@/lib/request-ip";
import { consumeRateLimit, RATE_LIMITS, rateLimitMinutes } from "@/lib/services/rate-limit.service";
import { type SignupResult, signUp as signUpUser } from "@/lib/services/signup.service";

export async function signUp(input: unknown, captchaToken?: string): Promise<SignupResult<string>> {
	const t = await getTranslations("auth.errors");

	const limit = await consumeRateLimit(`signup:ip:${clientIp(await headers())}`, RATE_LIMITS.signup);
	if (!limit.allowed) {
		const te = await getTranslations("errors");
		const minutes = rateLimitMinutes(limit.retryAfterSeconds);
		return { ok: false, fieldErrors: {}, error: te("rateLimited", { minutes }) };
	}

	// Captcha só é exigido em produção, como no login (app/entrar).
	const captcha = process.env.NODE_ENV === "production" ? { captchaToken, verifyCaptcha: isCaptchaValid } : undefined;
	const result = await signUpUser(input, captcha);
	if (result.ok) return result;

	// Só `nicknameTaken` interpola, e ele só existe depois de o schema validar o nickname como string.
	const nickname = String((input as { nickname?: unknown } | null)?.nickname ?? "");
	return {
		ok: false,
		fieldErrors: Object.fromEntries(
			Object.entries(result.fieldErrors).map(([field, key]) => [field, t(key, { nickname })]),
		),
		error: result.error && t(result.error),
	};
}
