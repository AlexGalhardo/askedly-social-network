import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { publicErrorMessage } from "@/lib/errors";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export const socialMediaSchema = z.object({
	instagram: z
		.string()
		.max(255, "URL do Instagram é muito longa (máximo 255 caracteres)")
		.optional()
		.refine((val) => !val || val.startsWith("https://instagram.com/"), {
			message: "URL do Instagram deve começar com https://instagram.com/",
		}),
	facebook: z
		.string()
		.max(255, "URL do Facebook é muito longa (máximo 255 caracteres)")
		.optional()
		.refine((val) => !val || val.startsWith("https://facebook.com/"), {
			message: "URL do Facebook deve começar com https://facebook.com/",
		}),
	youtube: z
		.string()
		.max(255, "URL do YouTube é muito longa (máximo 255 caracteres)")
		.optional()
		.refine((val) => !val || val.startsWith("https://youtube.com/"), {
			message: "URL do YouTube deve começar com https://youtube.com/",
		}),
	twitter: z
		.string()
		.max(255, "URL do Twitter é muito longa (máximo 255 caracteres)")
		.optional()
		.refine((val) => !val || val.startsWith("https://twitter.com/"), {
			message: "URL do Twitter deve começar com https://twitter.com/",
		}),
	tiktok: z
		.string()
		.max(255, "URL do TikTok é muito longa (máximo 255 caracteres)")
		.optional()
		.refine((val) => !val || val.startsWith("https://tiktok.com/"), {
			message: "URL do TikTok deve começar com https://tiktok.com/",
		}),
	linkedin: z
		.string()
		.max(255, "URL do LinkedIn é muito longa (máximo 255 caracteres)")
		.optional()
		.refine((val) => !val || val.startsWith("https://linkedin.com/in/"), {
			message: "URL do LinkedIn deve começar com https://linkedin.com/in/",
		}),
	twitch: z
		.string()
		.max(255, "URL do Twitch é muito longa (máximo 255 caracteres)")
		.optional()
		.refine((val) => !val || val.startsWith("https://twitch.tv/"), {
			message: "URL do Twitch deve começar com https://twitch.tv/",
		}),
});

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
		}

		const body = await req.json();

		const parsedData = socialMediaSchema.safeParse(body);
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
				message: "Redes sociais atualizadas com sucesso",
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
		return NextResponse.json({ error: publicErrorMessage(error, "Erro interno do servidor") }, { status: 500 });
	}
}
