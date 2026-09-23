import { cnpj, cpf } from "cpf-cnpj-validator";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[1-9]\d{10,14}$/;
const randomKeyRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const pixSchema = z.object({
	pixKey: z
		.string()
		.max(77, "Chave PIX inválida: máximo de 77 caracteres")
		.refine((key) => key.trim().length > 0, {
			message: "Chave PIX não pode estar vazia",
		})
		.refine(
			(key) => {
				const cleanKey = key.trim();
				const digitsOnly = cleanKey.replace(/\D/g, "");
				const isEmail = emailRegex.test(cleanKey);
				const isPhone = phoneRegex.test(digitsOnly);
				const isValidCPF = cpf.isValid(digitsOnly);
				const isValidCNPJ = cnpj.isValid(digitsOnly);
				const isRandomKey = randomKeyRegex.test(cleanKey);

				return isEmail || isPhone || isValidCPF || isValidCNPJ || isRandomKey;
			},
			{
				message: "Formato de chave PIX inválido. Use CPF, CNPJ, email, telefone ou chave aleatória.",
			},
		),
});

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session || !session.user?.id) {
			return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
		}

		const body = await req.json();

		const result = pixSchema.safeParse(body);

		if (!result.success) {
			const formattedErrors = result.error.issues.map((issue) => ({
				validation: "pixKey",
				code: issue.code,
				message: issue.message,
				path: issue.path,
			}));

			return NextResponse.json({ errors: formattedErrors }, { status: 400 });
		}

		const { pixKey } = result.data;

		const updatedUser = await prisma.user.update({
			where: {
				id: session.user.id,
			},
			data: {
				pix_key: pixKey.trim(),
				updated_at: new Date(),
			},
		});

		return NextResponse.json(
			{
				message: "Chave PIX atualizada com sucesso",
				user: {
					id: updatedUser.id,
					pix_key: updatedUser.pix_key,
				},
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Error updating pix key: ${error?.message}`);
		return NextResponse.json({ error: "Erro ao atualizar chave pix" }, { status: 500 });
	}
}
