import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { PixCharge } from "@/lib/abacatepay";
import { markChargePaid, registerCharge } from "@/lib/services/pix-charge.service";
import { CreateQuestionError, createPaidQuestion } from "@/lib/services/question-create.service";
import { prisma } from "@/prisma/prisma-client";

// Integração contra Postgres real e descartável (DATABASE_URL); nunca rode num banco com dados reais.
const run = Date.now();
const nicknames = { owner: `powner${run}`, asker: `pasker${run}`, other: `pother${run}` };
const ids: Record<keyof typeof nicknames, string> = { owner: "", asker: "", other: "" };

function charge(amount: number): PixCharge {
	return {
		id: `pix_char_test_${run}_${Math.random()}`,
		amount,
		status: "PENDING",
		devMode: true,
		brCode: "000201",
		brCodeBase64: "data:image/png;base64,",
		platformFee: 80,
		expiresAt: new Date(Date.now() + 600_000).toISOString(),
	};
}

const question = { questionText: "Qual livro mudou sua forma de pensar?", isAnonymous: false };
const stillPending = async (id: string) => ({ id, status: "PENDING" as const, expiresAt: "" });
const nowPaid = async (id: string) => ({ id, status: "PAID" as const, expiresAt: "" });

describe("PIX charges (integration)", () => {
	beforeAll(async () => {
		for (const [role, nickname] of Object.entries(nicknames)) {
			const user = await prisma.user.create({
				data: { name: role, nickname, email: `${nickname}@example.com`, api_key: `k-${nickname}` },
			});
			ids[role as keyof typeof ids] = user.id;
		}
	});

	afterAll(async () => {
		await prisma.question.deleteMany({ where: { owner_user_nickname: nicknames.owner } });
		await prisma.webhookAbacatePay.deleteMany({ where: { pix_id: { startsWith: `pix_char_test_${run}_` } } });
		await prisma.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
	});

	test("registers a pending charge with the gateway amount and the paying user", async () => {
		const pix = charge(700);
		await registerCharge(ids.asker, pix);

		const row = await prisma.webhookAbacatePay.findUniqueOrThrow({ where: { pix_id: pix.id } });
		expect(row).toMatchObject({ status: "PENDING", amount: 700, userId: ids.asker });
	});

	test("marks a charge paid only once, so webhook retries are no-ops", async () => {
		const pix = charge(300);
		await registerCharge(ids.asker, pix);

		expect(await markChargePaid(pix.id, "{}")).toBe(true);
		expect(await markChargePaid(pix.id, "{}")).toBe(false);
	});

	test("rejects a question for a charge that is still unpaid", async () => {
		const pix = charge(200);
		await registerCharge(ids.asker, pix);

		expect(
			createPaidQuestion({ ...question, askerId: ids.asker, ownerId: ids.owner, pixId: pix.id }, stillPending),
		).rejects.toBeInstanceOf(CreateQuestionError);
	});

	test("confirms with the gateway when the webhook has not arrived yet", async () => {
		const pix = charge(250);
		await registerCharge(ids.asker, pix);

		const created = await createPaidQuestion(
			{ ...question, askerId: ids.asker, ownerId: ids.owner, pixId: pix.id },
			nowPaid,
		);

		expect(created.amount_paid).toBe(250);
		const row = await prisma.webhookAbacatePay.findUniqueOrThrow({ where: { pix_id: pix.id } });
		expect(row.status).toBe("PAID");
	});

	test("rejects using a charge paid by someone else", async () => {
		const pix = charge(400);
		await registerCharge(ids.other, pix);
		await markChargePaid(pix.id, "{}");

		expect(
			createPaidQuestion({ ...question, askerId: ids.asker, ownerId: ids.owner, pixId: pix.id }, nowPaid),
		).rejects.toBeInstanceOf(CreateQuestionError);
	});
});
