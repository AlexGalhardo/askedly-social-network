import { authOptions } from "@/lib/auth";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";
import { getServerSession } from "next-auth";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const deleteAccountSchema = z.object({
	userId: z.string().uuid().min(1, "UUID do usuário é obrigatório para deletar conta"),
});

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session || !session.user?.id) {
			return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
		}

		const body = await req.json();
		const parseResult = deleteAccountSchema.safeParse(body);

		if (!parseResult.success) {
			return NextResponse.json(
				{
					errors: parseResult.error.errors.map((err) => ({
						path: err.path.join("."),
						message: err.message,
					})),
				},
				{ status: 400 },
			);
		}

		const { userId } = parseResult.data;

		if (userId !== session.user.id) {
			return NextResponse.json(
				{ error: "ID do usuário não corresponde ao usuário autenticado" },
				{ status: 403 },
			);
		}

		await prisma.user.update({
			where: { id: userId },
			data: {
				deleted_at: new Date(),
			},
		});

		return NextResponse.json({
			success: true,
			message: "Conta marcada para exclusão",
		});
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file user-actions.ts delete account: ${error?.message}`);
		return NextResponse.json({ error: error?.message ?? "Erro interno do servidor" }, { status: 500 });
	}
}
