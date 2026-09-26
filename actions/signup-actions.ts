"use server";

import { headers } from "next/headers";
import { isCaptchaValid } from "@/lib/captcha";
import { clientIp } from "@/lib/request-ip";
import { consumeRateLimit, RATE_LIMITS, rateLimitMessage } from "@/lib/services/rate-limit.service";
import { type SignupResult, signUp as signUpUser } from "@/lib/services/signup.service";

export async function signUp(input: unknown, captchaToken?: string): Promise<SignupResult> {
	const limit = await consumeRateLimit(`signup:ip:${clientIp(await headers())}`, RATE_LIMITS.signup);
	if (!limit.allowed) return { ok: false, fieldErrors: {}, error: rateLimitMessage(limit.retryAfterSeconds) };

	// Captcha só é exigido em produção, como no login (app/entrar).
	const captcha = process.env.NODE_ENV === "production" ? { captchaToken, verifyCaptcha: isCaptchaValid } : undefined;
	return signUpUser(input, captcha);
}
