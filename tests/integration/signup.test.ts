import { afterAll, describe, expect, test } from "bun:test";
import { signUp } from "@/lib/services/signup.service";
import { prisma } from "@/prisma/prisma-client";

// Integração contra Postgres real e descartável (DATABASE_URL); nunca rode num banco com dados reais.
const run = Date.now();
const nickname = `signup_${run}`.slice(0, 16);
const email = `signup-${run}@example.com`;
const valid = { name: "Signup Test", nickname, email, password: "Sup3r!Secret", acceptTerms: true };

describe("signUp (integration)", () => {
	afterAll(async () => {
		await prisma.user.deleteMany({ where: { email: { in: [email, `other-${email}`] } } });
	});

	test("validates on the server, whatever the browser sent", async () => {
		const result = await signUp({ ...valid, nickname: "x", password: "weak", acceptTerms: false });
		expect(result.ok).toBe(false);
		if (!result.ok) expect(Object.keys(result.fieldErrors).sort()).toEqual(["acceptTerms", "nickname", "password"]);
		expect(await prisma.user.findUnique({ where: { email } })).toBeNull();
	});

	test("creates the account with a hashed password", async () => {
		expect(await signUp(valid)).toEqual({ ok: true });
		const user = await prisma.user.findUniqueOrThrow({ where: { email } });
		expect(user.password).not.toBe(valid.password);
	});

	test("rejects a nickname or email that is already taken", async () => {
		expect(await signUp({ ...valid, email: `other-${email}` })).toEqual({
			ok: false,
			fieldErrors: { nickname: `Esse @${nickname} está indisponível` },
		});
		expect(await signUp({ ...valid, nickname: `other${run}`.slice(0, 16) })).toEqual({
			ok: false,
			fieldErrors: { email: "Esse Email está indisponível" },
		});
	});
});
