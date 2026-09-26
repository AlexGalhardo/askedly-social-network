import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createUser } from "@/lib/repositories/users.repository";
import { changePassword } from "@/lib/services/password.service";
import { createPasswordResetToken, resetPasswordWithToken } from "@/lib/services/password-reset.service";
import { assertSessionIsCurrent, SessionRevokedError } from "@/lib/services/session-revocation.service";
import { prisma } from "@/prisma/prisma-client";

// Integração contra Postgres real e descartável (DATABASE_URL); nunca rode num banco com dados reais.
const run = Date.now();
const email = `revoke-${run}@example.com`;
let userId = "";

async function tokenIssuedNow(): Promise<{ id: string; session_version: number }> {
	const { session_version } = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
	return { id: userId, session_version };
}

describe("session revocation (integration)", () => {
	beforeAll(async () => {
		userId = (await createUser("Revoke", `revoke${run}`, email, "Old!Pass123")).id;
	});

	afterAll(async () => {
		await prisma.user.deleteMany({ where: { id: userId } });
	});

	test("a token issued with the current version stays valid", async () => {
		await expect(assertSessionIsCurrent(await tokenIssuedNow())).resolves.toBeUndefined();
	});

	test("tokens issued before this change (no version) count as version 0", async () => {
		await expect(assertSessionIsCurrent({ id: userId })).resolves.toBeUndefined();
	});

	test("changing the password revokes every token issued before it", async () => {
		const before = await tokenIssuedNow();
		await changePassword(userId, "Old!Pass123", "New!Pass456");
		await expect(assertSessionIsCurrent(before)).rejects.toBeInstanceOf(SessionRevokedError);
		await expect(assertSessionIsCurrent(await tokenIssuedNow())).resolves.toBeUndefined();
	});

	test("resetting the password revokes every token issued before it", async () => {
		const before = await tokenIssuedNow();
		const reset = await createPasswordResetToken(email);
		await resetPasswordWithToken(reset?.token ?? "", "Reset!Pass789");
		await expect(assertSessionIsCurrent(before)).rejects.toBeInstanceOf(SessionRevokedError);
	});

	test("a token for a user that no longer exists is revoked", async () => {
		const token = { id: "00000000-0000-0000-0000-000000000000", session_version: 0 };
		await expect(assertSessionIsCurrent(token)).rejects.toBeInstanceOf(SessionRevokedError);
	});
});
