import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/prisma/prisma-client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import TelegramLog from "@/lib/telegram-logger";

export const passwordSchema = z
	.object({
		newPassword: z
			.string()
			.min(8, "A senha deve ter pelo menos 8 caracteres")
			.regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
			.regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
			.regex(/[0-9]/, "A senha deve conter pelo menos um número")
			.regex(/[^A-Za-z0-9]/, "A senha deve conter pelo menos um caractere especial"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "As senhas não coincidem",
		path: ["confirmPassword"],
	});

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session || !session.user?.id) {
			return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
		}

		const body = await req.json();

		const parsed = passwordSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{
					errors: parsed.error.errors.map((err) => ({
						path: err.path.join("."),
						message: err.message,
					})),
				},
				{ status: 400 },
			);
		}

		const { newPassword } = parsed.data;

		const existingUser = await prisma.user.findUnique({
			where: {
				id: session.user.id,
			},
		});

		if (!existingUser) {
			return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
		}

		const saltRounds = 12;
		const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

		await prisma.user.update({
			where: {
				id: session.user.id,
			},
			data: {
				password: hashedPassword,
				updated_at: new Date(),
			},
		});

		return NextResponse.json(
			{
				message: "Senha alterada com sucesso",
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file update-password.ts: ${error?.message}`);
		return NextResponse.json({ error: error?.message || "Erro interno do servidor" }, { status: 500 });
	}
}
