"use server";

import { headers } from "next/headers";
import { clientIp } from "@/lib/request-ip";
import { consumeRateLimit, RATE_LIMITS, rateLimitMessage } from "@/lib/services/rate-limit.service";
import { type SignupResult, signUp as signUpUser } from "@/lib/services/signup.service";

export async function signUp(input: unknown): Promise<SignupResult> {
	const limit = await consumeRateLimit(`signup:ip:${clientIp(await headers())}`, RATE_LIMITS.signup);
	if (!limit.allowed) return { ok: false, fieldErrors: {}, error: rateLimitMessage(limit.retryAfterSeconds) };

	return signUpUser(input);
}
