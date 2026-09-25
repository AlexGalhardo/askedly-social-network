import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { WithdrawError, withdrawBalance } from "@/lib/services/withdraw.service";
import { prisma } from "@/prisma/prisma-client";

// Integração contra Postgres real e descartável (DATABASE_URL); nunca rode num banco com dados reais.
const run = Date.now();
const ownerNickname = `wowner${run}`;
const askerNickname = `wasker${run}`;
let ownerId = "";
let askerId = "";
let questionId = "";

async function createAnsweredQuestion(amountPaid: number): Promise<string> {
	const webhook = await prisma.webhookAbacatePay.create({
		data: {
			pix_id: `pix-${run}-${Math.random()}`,
			status: "PAID",
			amount: amountPaid,
			fee: 0,
			kind: "PIX",
			event_status: "billing.paid",
			dev_mode: true,
			complete_event: "{}",
		},
	});
	const question = await prisma.question.create({
		data: {
			question_text: "Pergunta de teste de saque",
			amount_paid: amountPaid,
			owner_user_nickname: ownerNickname,
			asked_by_user_nickname: askerNickname,
			question_is_awaiting_answer: false,
			question_answered: true,
			answer_text: "Resposta",
			answered_at: new Date(),
			webhook_id: webhook.id,
		},
	});
	return question.id;
}

describe("withdrawBalance (integration)", () => {
	beforeAll(async () => {
		const owner = await prisma.user.create({
			data: {
				name: "Owner",
				nickname: ownerNickname,
				email: `${ownerNickname}@example.com`,
				pix_key: "owner@pix",
				api_key: `k-${ownerNickname}`,
			},
		});
		const asker = await prisma.user.create({
			data: {
				name: "Asker",
				nickname: askerNickname,
				email: `${askerNickname}@example.com`,
				pix_key: "asker@pix",
				api_key: `k-${askerNickname}`,
			},
		});
		ownerId = owner.id;
		askerId = asker.id;
		questionId = await createAnsweredQuestion(1000);
	});

	afterAll(async () => {
		await prisma.question.deleteMany({ where: { owner_user_nickname: ownerNickname } });
		await prisma.paymentWithdraw.deleteMany({ where: { user_id: { in: [ownerId, askerId] } } });
		await prisma.webhookAbacatePay.deleteMany({ where: { pix_id: { startsWith: `pix-${run}-` } } });
		await prisma.user.deleteMany({ where: { id: { in: [ownerId, askerId] } } });
	});

	test("rejects withdrawing a question that belongs to someone else", async () => {
		expect(withdrawBalance(askerId, [questionId])).rejects.toBeInstanceOf(WithdrawError);
	});

	test("pays the owner the server-computed amount to the owner's own PIX key", async () => {
		const result = await withdrawBalance(ownerId, [questionId]);

		expect(result.amount).toBe(700);
		const withdraw = await prisma.paymentWithdraw.findUniqueOrThrow({ where: { id: result.withdrawId } });
		expect(withdraw.amount_withdraw).toBe(700);
		expect(withdraw.send_to_pix_key).toBe("owner@pix");
	});

	test("never pays the same question twice, even concurrently", async () => {
		const freshId = await createAnsweredQuestion(400);

		const results = await Promise.allSettled([
			withdrawBalance(ownerId, [freshId]),
			withdrawBalance(ownerId, [freshId]),
		]);

		expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
		expect(withdrawBalance(ownerId, [questionId])).rejects.toBeInstanceOf(WithdrawError);
	});
});
