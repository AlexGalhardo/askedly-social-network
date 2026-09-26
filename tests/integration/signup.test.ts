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
		await prisma.user.deleteMany({
			where: { email: { in: [email, `other-${email}`, `captcha-${email}`, `captcha-ok-${email}`] } },
		});
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

	test("refuses to create the account when the captcha check fails", async () => {
		const other = { ...valid, nickname: `cap${run}`.slice(0, 16), email: `captcha-${email}` };
		const result = await signUp(other, { captchaToken: "bad", verifyCaptcha: async () => false });
		expect(result).toEqual({ ok: false, fieldErrors: {}, error: expect.any(String) });
		expect(await prisma.user.findUnique({ where: { email: other.email } })).toBeNull();
	});

	test("creates the account when the captcha check passes", async () => {
		const other = { ...valid, nickname: `capok${run}`.slice(0, 16), email: `captcha-ok-${email}` };
		const seen: (string | undefined)[] = [];
		const verifyCaptcha = async (token: string | undefined) => {
			seen.push(token);
			return true;
		};
		expect(await signUp(other, { captchaToken: "good", verifyCaptcha })).toEqual({ ok: true });
		expect(seen).toEqual(["good"]);
		await prisma.user.deleteMany({ where: { email: other.email } });
	});
});
