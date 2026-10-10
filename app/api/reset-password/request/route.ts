import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { ResetPasswordEmail } from "@/emails/reset-password-email";
import { EMAIL_FROM, resendClient } from "@/lib/email";
import { clientIp } from "@/lib/request-ip";
import { createPasswordResetToken } from "@/lib/services/password-reset.service";
import { consumeRateLimit, RATE_LIMITS, rateLimitMinutes } from "@/lib/services/rate-limit.service";
import TelegramLog from "@/lib/telegram-logger";

export async function POST(request: Request) {
	const t = await getTranslations("auth");
	try {
		const limit = await consumeRateLimit(
			`password-reset:ip:${clientIp(request.headers)}`,
			RATE_LIMITS.passwordReset,
		);
		if (!limit.allowed) {
			const te = await getTranslations("errors");
			const minutes = rateLimitMinutes(limit.retryAfterSeconds);
			return NextResponse.json({ error: te("rateLimited", { minutes }) }, { status: 429 });
		}

		const { email } = await request.json();
		if (typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
			return NextResponse.json({ error: t("errors.invalidEmail") }, { status: 400 });
		}

		// Same response with or without an account: the route must not be usable to discover which emails are registered.
		const reset = await createPasswordResetToken(email);
		if (!reset) return NextResponse.json({ success: true });

		const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/change-password?token=${reset.token}`;
		const { error } = await resendClient().emails.send({
			from: EMAIL_FROM,
			to: email,
			subject: t("resetPassword.emailSubject"),
			react: ResetPasswordEmail({ name: reset.name, resetLink, t: await getTranslations("emails") }),
		});
		if (error) await TelegramLog.error(`Password reset: failed to send email: ${error.message}`);

		return NextResponse.json({ success: true });
	} catch (error: unknown) {
		await TelegramLog.error(`Password reset (request): ${error instanceof Error ? error.message : error}`);
		return NextResponse.json({ error: t("errors.resetRequestFailed") }, { status: 500 });
	}
}
