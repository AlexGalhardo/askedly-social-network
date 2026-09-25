import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { reportAnswer, reportQuestion } from "@/lib/services/question-report.service";
import { prisma } from "@/prisma/prisma-client";

// Integração contra Postgres real e descartável (DATABASE_URL); nunca rode num banco com dados reais.
const run = Date.now();
const owner = `rowner${run}`;
const asker = `rasker${run}`;
const stranger = `rstranger${run}`;

async function createQuestion(answered: boolean): Promise<string> {
	const webhook = await prisma.webhookAbacatePay.create({
		data: {
			pix_id: `rpix-${run}-${Math.random()}`,
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
			question_text: "Pergunta de teste de report",
			amount_paid: 500,
			owner_user_nickname: owner,
			asked_by_user_nickname: asker,
			webhook_id: webhook.id,
			...(answered && {
				answer_text: "Resposta",
				answered_at: new Date(),
				question_answered: true,
				question_is_awaiting_answer: false,
			}),
		},
	});
	return question.id;
}

describe("question reports (integration)", () => {
	beforeAll(async () => {
		for (const nickname of [owner, asker, stranger]) {
			await prisma.user.create({
				data: { name: nickname, nickname, email: `${nickname}@example.com`, api_key: `k-${nickname}` },
			});
		}
	});

	afterAll(async () => {
		await prisma.question.deleteMany({ where: { owner_user_nickname: owner } });
		await prisma.webhookAbacatePay.deleteMany({ where: { pix_id: { startsWith: `rpix-${run}-` } } });
		await prisma.user.deleteMany({ where: { nickname: { in: [owner, asker, stranger] } } });
	});

	test("only the question owner can report a question", async () => {
		const id = await createQuestion(false);
		expect(await reportQuestion(id, stranger, "offensive")).toBe(false);
		expect((await prisma.question.findUniqueOrThrow({ where: { id } })).question_is_awaiting_answer).toBe(true);

		expect(await reportQuestion(id, owner, "offensive")).toBe(true);
		const reported = await prisma.question.findUniqueOrThrow({ where: { id } });
		expect(reported.owner_reported_offensive_question).toBe(true);
		expect(reported.question_is_awaiting_answer).toBe(false);
	});

	test("only the asker can report an answer, once, and only after it exists", async () => {
		const unanswered = await createQuestion(false);
		expect(await reportAnswer(unanswered, asker, "offensive")).toBe(false);

		const id = await createQuestion(true);
		expect(await reportAnswer(id, stranger, "offensive")).toBe(false);
		expect(await reportAnswer(id, owner, "offensive")).toBe(false);

		expect(await reportAnswer(id, asker, "inappropriate")).toBe(true);
		const reported = await prisma.question.findUniqueOrThrow({ where: { id } });
		expect(reported.asker_reported_answer).toBe(true);
		expect(reported.asker_reported_answer_reason).toBe("inappropriate");
		expect(reported.asker_reported_answer_at).not.toBeNull();

		expect(await reportAnswer(id, asker, "offensive")).toBe(false);
	});
});
