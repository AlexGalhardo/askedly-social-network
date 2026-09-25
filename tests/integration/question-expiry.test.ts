import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { expireQuestion } from "@/lib/services/question-expiry.service";
import { prisma } from "@/prisma/prisma-client";

// Integração contra Postgres real e descartável (DATABASE_URL); nunca rode num banco com dados reais.
const run = Date.now();
const owner = `xowner${run}`;
const asker = `xasker${run}`;
const stranger = `xstranger${run}`;
const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

async function createQuestion(overrides: { created_at?: Date; question_answered?: boolean } = {}): Promise<string> {
	const webhook = await prisma.webhookAbacatePay.create({
		data: {
			pix_id: `xpix-${run}-${Math.random()}`,
			status: "PAID",
			amount: 500,
			fee: 0,
			kind: "PIX",
			event_status: "billing.paid",
			dev_mode: true,
			complete_event: "{}",
		},
	});
	const question = await prisma.question.create({
		data: {
			question_text: "Pergunta de teste de expiração",
			amount_paid: 500,
			owner_user_nickname: owner,
			asked_by_user_nickname: asker,
			webhook_id: webhook.id,
			...(overrides.question_answered && { question_answered: true, question_is_awaiting_answer: false }),
			...(overrides.created_at && { created_at: overrides.created_at }),
		},
	});
	return question.id;
}

describe("expireQuestion (integration)", () => {
	beforeAll(async () => {
		for (const nickname of [owner, asker, stranger]) {
			await prisma.user.create({
				data: { name: nickname, nickname, email: `${nickname}@example.com`, api_key: `k-${nickname}` },
			});
		}
	});

	afterAll(async () => {
		await prisma.question.deleteMany({ where: { owner_user_nickname: owner } });
		await prisma.webhookAbacatePay.deleteMany({ where: { pix_id: { startsWith: `xpix-${run}-` } } });
		await prisma.user.deleteMany({ where: { nickname: { in: [owner, asker, stranger] } } });
	});

	test("does not expire a question before the answer window ends", async () => {
		expect(await expireQuestion(await createQuestion(), owner)).toBe(false);
	});

	test("does not let someone outside the question expire it", async () => {
		expect(await expireQuestion(await createQuestion({ created_at: eightDaysAgo }), stranger)).toBe(false);
	});

	test("does not expire an answered question", async () => {
		const id = await createQuestion({ created_at: eightDaysAgo, question_answered: true });
		expect(await expireQuestion(id, owner)).toBe(false);
	});

	test("expires an unanswered question after the window, for the owner or the asker", async () => {
		const id = await createQuestion({ created_at: eightDaysAgo });

		expect(await expireQuestion(id, asker)).toBe(true);

		const question = await prisma.question.findUniqueOrThrow({ where: { id } });
		expect(question.question_answer_was_expired).toBe(true);
		expect(question.question_is_awaiting_answer).toBe(false);
		expect(question.question_answer_expired_at).not.toBeNull();
	});
});
