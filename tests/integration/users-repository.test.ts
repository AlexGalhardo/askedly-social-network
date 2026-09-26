import { afterAll, describe, expect, test } from "bun:test";
import {
	createUser,
	getUserByEmail,
	reactiveDeletedAccount,
	regenerateApiKey,
	updateUserPassword,
	verifyCredentials,
} from "@/lib/repositories/users.repository";
import { prisma } from "@/prisma/prisma-client";

// Integration test: hits a real Postgres (DATABASE_URL) -- no mocking.
// Never point DATABASE_URL at a database with real/seed data when running this.
const testEmail = `integration-test-${Date.now()}@example.com`;
const testNickname = `itest${Date.now()}`;

describe("users.repository (integration)", () => {
	afterAll(async () => {
		await prisma.user.deleteMany({ where: { email: testEmail } });
	});

	test("createUser persists a user and hashes the password", async () => {
		const user = await createUser("Integration Test", testNickname, testEmail, "plain-text-password");

		expect(user.id).toBeTruthy();
		expect(user.email).toBe(testEmail);
		expect(user.password).not.toBe("plain-text-password");
	});

	test("getUserByEmail returns the created user with relations included", async () => {
		const user = await getUserByEmail(testEmail);

		expect(user).not.toBeNull();
		expect(user?.nickname).toBe(testNickname);
		expect(user?.followers).toEqual([]);
	});

	test("verifyCredentials accepts the right password and rejects the wrong one", async () => {
		const valid = await verifyCredentials(testEmail, "plain-text-password");
		expect(valid?.email).toBe(testEmail);

		const invalid = await verifyCredentials(testEmail, "wrong-password");
		expect(invalid).toBeNull();
	});

	test("verifyCredentials takes as long for an unknown email as for a wrong password", async () => {
		const time = async (email: string): Promise<number> => {
			const start = performance.now();
			await verifyCredentials(email, "wrong-password");
			return performance.now() - start;
		};
		const known = await time(testEmail);
		const unknown = await time(`nobody-${Date.now()}@example.com`);
		// Sem o bcrypt de fachada o email inexistente responde em ~1ms contra centenas de ms: dá para listar contas.
		expect(unknown).toBeGreaterThan(known * 0.5);
	});

	test("updateUserPassword changes the password used by verifyCredentials", async () => {
		const user = await getUserByEmail(testEmail);
		await updateUserPassword(user!.id, "new-password");

		expect(await verifyCredentials(testEmail, "plain-text-password")).toBeNull();
		expect((await verifyCredentials(testEmail, "new-password"))?.email).toBe(testEmail);
	});

	test("regenerateApiKey rotates the stored api_key", async () => {
		const before = await getUserByEmail(testEmail);
		const { apiKey } = await regenerateApiKey(before!.id);

		const after = await getUserByEmail(testEmail);
		expect(after?.api_key).toBe(apiKey);
		expect(after?.api_key).not.toBe(before?.api_key);
	});

	test("reactiveDeletedAccount clears deleted_at", async () => {
		const user = await getUserByEmail(testEmail);
		await prisma.user.update({ where: { id: user!.id }, data: { deleted_at: new Date() } });

		await reactiveDeletedAccount(user!.id);

		const reactivated = await getUserByEmail(testEmail);
		expect(reactivated?.deleted_at).toBeNull();
	});
});
