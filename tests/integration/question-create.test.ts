import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { CreateQuestionError, createPaidQuestion } from "@/lib/services/question-create.service";
import { prisma } from "@/prisma/prisma-client";

// Integração contra Postgres real e descartável (DATABASE_URL); nunca rode num banco com dados reais.
const run = Date.now();
const ownerNickname = `cowner${run}`;
const askerNickname = `casker${run}`;
let ownerId = "";
let askerId = "";

async function paidWebhook(amount: number): Promise<string> {
	const pixId = `cpix-${run}-${Math.random()}`;
	await prisma.webhookAbacatePay.create({
		data: {
			pix_id: pixId,
			status: "PAID",
			amount,
			fee: 0,
			kind: "PIX",
			event_status: "billing.paid",
			dev_mode: false,
			complete_event: "{}",
		},
	});
	return pixId;
}

const base = { questionText: "Qual foi a melhor decisão da sua carreira?", isAnonymous: false };

describe("createPaidQuestion (integration)", () => {
	beforeAll(async () => {
		const owner = await prisma.user.create({
			data: {
				name: "Owner",
				nickname: ownerNickname,
				email: `${ownerNickname}@example.com`,
				api_key: `k-${ownerNickname}`,
			},
		});
		const asker = await prisma.user.create({
			data: {
				name: "Asker",
				nickname: askerNickname,
				email: `${askerNickname}@example.com`,
				api_key: `k-${askerNickname}`,
				public_questions_remaining_today: 1,
			},
		});
		ownerId = owner.id;
		askerId = asker.id;
	});

	afterAll(async () => {
		await prisma.question.deleteMany({ where: { owner_user_nickname: ownerNickname } });
		await prisma.webhookAbacatePay.deleteMany({ where: { pix_id: { startsWith: `cpix-${run}-` } } });
		await prisma.user.deleteMany({ where: { id: { in: [ownerId, askerId] } } });
	});

	test("records the amount actually paid, ignoring any amount the client claims", async () => {
		const question = await createPaidQuestion({ ...base, askerId, ownerId, pixId: await paidWebhook(200) });

		expect(question.amount_paid).toBe(200);
		expect(question.asked_by_user_nickname).toBe(askerNickname);
	});

	test("rejects a payment that already has a question", async () => {
		const pixId = await paidWebhook(300);
		await prisma.user.update({ where: { id: askerId }, data: { public_questions_remaining_today: 5 } });
		await createPaidQuestion({ ...base, askerId, ownerId, pixId });

		expect(createPaidQuestion({ ...base, askerId, ownerId, pixId })).rejects.toBeInstanceOf(CreateQuestionError);
	});

	test("rejects an unknown payment", async () => {
		expect(createPaidQuestion({ ...base, askerId, ownerId, pixId: `cpix-${run}-missing` })).rejects.toBeInstanceOf(
			CreateQuestionError,
		);
	});

	test("enforces the daily question limit", async () => {
		await prisma.user.update({ where: { id: askerId }, data: { public_questions_remaining_today: 0 } });

		expect(createPaidQuestion({ ...base, askerId, ownerId, pixId: await paidWebhook(200) })).rejects.toBeInstanceOf(
			CreateQuestionError,
		);
	});
});
