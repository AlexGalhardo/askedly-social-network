import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { resetPasswordWithToken } from "@/lib/services/password-reset.service";
import TelegramLog from "@/lib/telegram-logger";

export async function POST(request: Request) {
	const t = await getTranslations("auth.errors");
	try {
		const { token, password } = await request.json();
		if (typeof token !== "string" || token.length !== 32 || typeof password !== "string") {
			return NextResponse.json({ error: t("invalidToken") }, { status: 400 });
		}

		const result = await resetPasswordWithToken(token, password);
		if (!result.ok) return NextResponse.json({ error: t(result.error) }, { status: 400 });

		return NextResponse.json({ success: true });
	} catch (error: unknown) {
		await TelegramLog.error(`Password reset: ${error instanceof Error ? error.message : error}`);
		return NextResponse.json({ error: t("resetFailed") }, { status: 500 });
	}
}
