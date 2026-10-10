import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { createCreditsCheckout, isValidCreditsPurchase } from "@/lib/services/credits.service";
import { consumeRateLimit, RATE_LIMITS, rateLimitMinutes } from "@/lib/services/rate-limit.service";
import { getSessionUser } from "@/lib/session";
import TelegramLog from "@/lib/telegram-logger";

export async function POST(request: Request) {
	try {
		const user = await getSessionUser();
		if (!user)
			return NextResponse.json({ error: (await getTranslations("errors"))("unauthorized") }, { status: 401 });

		const limit = await consumeRateLimit(`credits-checkout:${user.id}`, RATE_LIMITS.creditsCheckout);
		if (!limit.allowed) {
			return NextResponse.json(
				{
					error: (await getTranslations("errors"))("rateLimited", {
						minutes: rateLimitMinutes(limit.retryAfterSeconds),
					}),
				},
				{ status: 429 },
			);
		}

		const { amount } = await request.json();
		if (!isValidCreditsPurchase(amount)) {
			return NextResponse.json(
				{ error: (await getTranslations("payments"))("api.invalidAmount") },
				{ status: 400 },
			);
		}

		return NextResponse.json({ url: await createCreditsCheckout(user.id, amount) });
	} catch (error: unknown) {
		await TelegramLog.error(`Stripe checkout: ❌ ${(error as Error)?.message}`);
		return NextResponse.json({ error: (await getTranslations("payments"))("api.checkoutFailed") }, { status: 502 });
	}
}
