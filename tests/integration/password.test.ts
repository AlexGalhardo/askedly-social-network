import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createUser, verifyCredentials } from "@/lib/repositories/users.repository";
import { changePassword, PasswordChangeError } from "@/lib/services/password.service";
import { prisma } from "@/prisma/prisma-client";

// Integração contra Postgres real e descartável (DATABASE_URL); nunca rode num banco com dados reais.
const run = Date.now();
const withPassword = `pwuser${run}`;
const googleOnly = `pwgoogle${run}`;
let withPasswordId = "";
let googleOnlyId = "";

describe("changePassword (integration)", () => {
	beforeAll(async () => {
		await createUser("Com Senha", withPassword, `${withPassword}@example.com`, "Old!Pass123");
		await createUser("Google", googleOnly, `${googleOnly}@example.com`);
		withPasswordId = (await prisma.user.findUniqueOrThrow({ where: { nickname: withPassword } })).id;
		googleOnlyId = (await prisma.user.findUniqueOrThrow({ where: { nickname: googleOnly } })).id;
	});

	afterAll(async () => {
		await prisma.user.deleteMany({ where: { id: { in: [withPasswordId, googleOnlyId] } } });
	});

	test("rejects the change when the current password is wrong", async () => {
		await expect(changePassword(withPasswordId, "Wrong!Pass1", "New!Pass456")).rejects.toBeInstanceOf(
			PasswordChangeError,
		);
		expect(await verifyCredentials(`${withPassword}@example.com`, "Old!Pass123")).toBeTruthy();
	});

	test("rejects the change when the current password is missing", async () => {
		await expect(changePassword(withPasswordId, undefined, "New!Pass456")).rejects.toBeInstanceOf(
			PasswordChangeError,
		);
	});

	test("changes the password when the current one is correct", async () => {
		await changePassword(withPasswordId, "Old!Pass123", "New!Pass456");
		expect(await verifyCredentials(`${withPassword}@example.com`, "New!Pass456")).toBeTruthy();
	});

	test("lets an account without a password (Google sign-in) set its first one", async () => {
		await changePassword(googleOnlyId, undefined, "First!Pass789");
		expect(await verifyCredentials(`${googleOnly}@example.com`, "First!Pass789")).toBeTruthy();
	});
});
