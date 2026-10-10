import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { isResetTokenValid } from "@/lib/services/password-reset.service";
import TelegramLog from "@/lib/telegram-logger";

export async function GET(request: Request) {
	const t = await getTranslations("auth.errors");
	try {
		const token = new URL(request.url).searchParams.get("token");
		if (token?.length !== 32 || !(await isResetTokenValid(token))) {
			return NextResponse.json({ error: t("invalidOrExpiredToken") }, { status: 400 });
		}
		return NextResponse.json({ success: true, valid: true });
	} catch (error: unknown) {
		await TelegramLog.error(`Reset de senha (verify): ${error instanceof Error ? error.message : error}`);
		return NextResponse.json({ error: t("verifyTokenFailed") }, { status: 500 });
	}
}
