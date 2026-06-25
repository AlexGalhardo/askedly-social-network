import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserById } from "@/lib/repositories/users.repository";
import TelegramLog from "@/lib/telegram-logger";

export async function GET(_: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Sessão não encontrada ou expirada" }, { status: 401 });
		}

		const user = await getUserById(session.user.id);
		if (!user) {
			return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 });
		}

		return NextResponse.json({
			user: session.user,
			expires: session.expires,
		});
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file auth-actions.ts verify session: ${error?.message}`);
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
	}
}
