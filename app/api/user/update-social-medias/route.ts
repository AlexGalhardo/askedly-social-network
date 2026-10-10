import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { publicErrorMessage } from "@/lib/errors";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

type Translator = Awaited<ReturnType<typeof getTranslations<"account">>>;

const createSocialMediaSchema = (t: Translator) => {
	const socialUrl = (platform: string, prefix: string) =>
		z
			.string()
			.max(255, t("errors.socialUrlTooLong", { platform }))
			.optional()
			.refine((val) => !val || val.startsWith(prefix), {
				message: t("errors.socialUrlPrefix", { platform, prefix }),
			});

	return z.object({
		instagram: socialUrl("Instagram", "https://instagram.com/"),
		facebook: socialUrl("Facebook", "https://facebook.com/"),
		youtube: socialUrl("YouTube", "https://youtube.com/"),
		twitter: socialUrl("Twitter", "https://twitter.com/"),
		tiktok: socialUrl("TikTok", "https://tiktok.com/"),
		linkedin: socialUrl("LinkedIn", "https://linkedin.com/in/"),
		twitch: socialUrl("Twitch", "https://twitch.tv/"),
	});
};

export async function POST(req: NextRequest) {
	const te = await getTranslations("errors");
	const t = await getTranslations("account");
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ error: te("unauthorized") }, { status: 401 });
		}

		const body = await req.json();

		const parsedData = createSocialMediaSchema(t).safeParse(body);
		if (!parsedData.success) {
			const firstError = parsedData.error.issues[0];
			return NextResponse.json({ error: firstError.message }, { status: 400 });
		}

		const cleanUrl = (url: string | undefined) => {
			if (!url || url.trim() === "") return null;
			return url.trim();
		};

		const updatedUser = await prisma.user.update({
			where: { id: session.user.id },
			data: {
				instagram: cleanUrl(parsedData.data.instagram),
				facebook: cleanUrl(parsedData.data.facebook),
				youtube: cleanUrl(parsedData.data.youtube),
				twitter: cleanUrl(parsedData.data.twitter),
				tiktok: cleanUrl(parsedData.data.tiktok),
				linkedin: cleanUrl(parsedData.data.linkedin),
				twitch: cleanUrl(parsedData.data.twitch),
				updated_at: new Date(),
			},
		});

		return NextResponse.json(
			{
				message: t("api.socialUpdated"),
				user: {
					id: updatedUser.id,
					instagram: updatedUser.instagram,
					facebook: updatedUser.facebook,
					youtube: updatedUser.youtube,
					twitter: updatedUser.twitter,
					tiktok: updatedUser.tiktok,
					linkedin: updatedUser.linkedin,
					twitch: updatedUser.twitch,
				},
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file update-social-medias.ts: ${error?.message}`);
		return NextResponse.json({ error: publicErrorMessage(error, te("internal")) }, { status: 500 });
	}
}
