import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { verifyCredentials } from "@/lib/repositories/users.repository";
import {
	createPasswordResetToken,
	isResetTokenValid,
	resetPasswordWithToken,
} from "@/lib/services/password-reset.service";
import { prisma } from "@/prisma/prisma-client";

// Integração contra Postgres real e descartável (DATABASE_URL); nunca rode num banco com dados reais.
const run = Date.now();
const email = `reset-${run}@example.com`;

describe("password reset (integration)", () => {
	beforeAll(async () => {
		await prisma.user.create({
			data: { name: "Reset", nickname: `reset${run}`, email, api_key: `k-reset-${run}` },
		});
	});

	afterAll(async () => {
		await prisma.user.deleteMany({ where: { email } });
	});

	test("returns nothing for an unknown email", async () => {
		expect(await createPasswordResetToken(`nobody-${run}@example.com`)).toBeNull();
	});

	test("stores only a hash of the token", async () => {
		const created = await createPasswordResetToken(email);
		expect(created?.token).toHaveLength(32);
		const row = await prisma.user.findUniqueOrThrow({ where: { email } });
		expect(row.reset_password_token).not.toBe(created?.token);
		expect(await isResetTokenValid(created?.token ?? "")).toBe(true);
	});

	test("rejects a weak new password without consuming the token", async () => {
		const created = await createPasswordResetToken(email);
		const token = created?.token ?? "";
		expect(await resetPasswordWithToken(token, "short")).toEqual({ ok: false, error: expect.any(String) });
		expect(await isResetTokenValid(token)).toBe(true);
	});

	test("a token resets the password once", async () => {
		const created = await createPasswordResetToken(email);
		const token = created?.token ?? "";
		const results = await Promise.all([
			resetPasswordWithToken(token, "New!Pass123"),
			resetPasswordWithToken(token, "Other!Pass456"),
		]);
		expect(results.filter((r) => r.ok)).toHaveLength(1);
		expect(await isResetTokenValid(token)).toBe(false);
	});

	test("the new password works for login", async () => {
		const created = await createPasswordResetToken(email);
		await resetPasswordWithToken(created?.token ?? "", "Final!Pass789");
		expect(await verifyCredentials(email, "Final!Pass789")).toBeTruthy();
	});

	test("an expired token is refused", async () => {
		const created = await createPasswordResetToken(email);
		await prisma.user.update({
			where: { email },
			data: { reset_password_token_expires_at: new Date(Date.now() - 1000) },
		});
		expect(await isResetTokenValid(created?.token ?? "")).toBe(false);
		expect((await resetPasswordWithToken(created?.token ?? "", "Late!Pass123")).ok).toBe(false);
	});
});
