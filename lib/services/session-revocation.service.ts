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
 * Called by the `jwt` callback on every session read. Throwing here makes NextAuth return an empty session and delete
 * the cookie: that is how a password change invalidates already issued tokens, on every device.
 * Tokens issued before this mechanism have no version and count as 0 (the column default).
 */
export async function assertSessionIsCurrent(token: { id?: unknown; session_version?: unknown }): Promise<void> {
	if (typeof token.id !== "string") throw new SessionRevokedError();
	const current = await getSessionVersion(token.id);
	const issued = typeof token.session_version === "number" ? token.session_version : 0;
	if (current === null || current !== issued) throw new SessionRevokedError();
}
