import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface SessionUser {
	id: string;
	nickname: string;
}

/** Usuário autenticado da requisição atual. Rotas e Server Actions devem usar isto, nunca ids/nicknames do body. */
export async function getSessionUser(): Promise<SessionUser | null> {
	const session = await getServerSession(authOptions);
	const user = session?.user;
	return user?.id && user.nickname ? { id: user.id, nickname: user.nickname } : null;
}
