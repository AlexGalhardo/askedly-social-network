import { prisma } from "@/prisma/prisma-client";

export class SessionRevokedError extends Error {
	constructor() {
		super("session_revoked");
	}
}

export async function getSessionVersion(userId: string): Promise<number | null> {
	const user = await prisma.user.findUnique({ where: { id: userId }, select: { session_version: true } });
	return user?.session_version ?? null;
}

/**
 * Chamado pelo callback `jwt` em toda leitura de sessão. Lançar aqui faz o NextAuth devolver sessão vazia e apagar
 * o cookie: é assim que uma troca de senha derruba os tokens já emitidos, em todos os aparelhos.
 * Tokens emitidos antes deste mecanismo não têm versão e contam como 0 (o default da coluna).
 */
export async function assertSessionIsCurrent(token: { id?: unknown; session_version?: unknown }): Promise<void> {
	if (typeof token.id !== "string") throw new SessionRevokedError();
	const current = await getSessionVersion(token.id);
	const issued = typeof token.session_version === "number" ? token.session_version : 0;
	if (current === null || current !== issued) throw new SessionRevokedError();
}
