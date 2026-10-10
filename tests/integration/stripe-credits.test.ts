import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { fulfillCreditsPurchase } from "@/lib/services/credits.service";
import { CreateQuestionError, createCreditQuestion } from "@/lib/services/question-create.service";
import { type SendTransfer, settleCreditQuestion } from "@/lib/services/stripe-connect.service";
import { prisma } from "@/prisma/prisma-client";

// Integração contra Postgres real e descartável (DATABASE_URL); nunca rode num banco com dados reais.
// A Stripe não é chamada: a transferência entra pelo parâmetro `sendTransfer`.
const run = Date.now();
const ownerNickname = `sowner${run}`;
const askerNickname = `sasker${run}`;
let ownerId = "";
let askerId = "";

const credits = async (): Promise<number> =>
	(await prisma.user.findUniqueOrThrow({ where: { id: askerId } })).credits_cents;

const ask = (amountCents: number) =>
	createCreditQuestion({
		askerId,
		ownerId,
		amountCents,
		questionText: "Pergunta paga com créditos",
		isAnonymous: false,
	});

describe("créditos Stripe (integration)", () => {
	beforeAll(async () => {
		const user = (nickname: string, extra: object = {}) =>
			prisma.user.create({
				data: {
					name: nickname,
					nickname,
					email: `${nickname}@example.com`,
					api_key: `k-${nickname}`,
					public_questions_remaining_today: 100,
					...extra,
				},
			});
		ownerId = (await user(ownerNickname, { stripe_account_id: `acct_${run}` })).id;
		askerId = (await user(askerNickname)).id;
		await prisma.stripePurchase.create({
			data: { user_id: askerId, checkout_session_id: `cs_${run}`, amount_cents: 2000 },
		});
	});

	afterAll(async () => {
		await prisma.question.deleteMany({ where: { owner_user_nickname: ownerNickname } });
		await prisma.user.deleteMany({ where: { id: { in: [ownerId, askerId] } } });
	});

	test("webhook repetido ou concorrente credita a compra uma vez só", async () => {
		const results = await Promise.all([fulfillCreditsPurchase(`cs_${run}`), fulfillCreditsPurchase(`cs_${run}`)]);
		expect(results.filter(Boolean)).toHaveLength(1);
		expect(await fulfillCreditsPurchase(`cs_${run}`)).toBe(false);
		expect(await fulfillCreditsPurchase("cs_inexistente")).toBe(false);
		expect(await credits()).toBe(2000);
	});

	test("perguntas simultâneas não gastam o mesmo crédito", async () => {
		const results = await Promise.allSettled([ask(1500), ask(1500)]);
		expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
		expect(await credits()).toBe(500);
	});

	test("recusa valor abaixo do mínimo e saldo insuficiente sem debitar", async () => {
		await expect(ask(100)).rejects.toBeInstanceOf(CreateQuestionError);
		await expect(ask(501)).rejects.toBeInstanceOf(CreateQuestionError);
		await expect(
			createCreditQuestion({
				askerId,
				ownerId: askerId,
				amountCents: 200,
				questionText: "Para mim",
				isAnonymous: false,
			}),
		).rejects.toMatchObject({ message: "cannotAskYourself" });
		expect(await credits()).toBe(500);
	});

	test("pergunta recusada devolve os créditos inteiros, uma vez só", async () => {
		const question = await ask(500);
		expect(await credits()).toBe(0);

		await settleCreditQuestion(question.id);
		expect(await credits()).toBe(0); // ainda aguardando resposta: nada a liquidar

		await prisma.question.update({
			where: { id: question.id },
			data: { question_is_awaiting_answer: false, question_answer_was_recused: true },
		});
		await Promise.all([settleCreditQuestion(question.id), settleCreditQuestion(question.id)]);
		await settleCreditQuestion(question.id);
		expect(await credits()).toBe(500);
	});

	test("pergunta respondida transfere ao dono o valor sem a taxa, uma vez só", async () => {
		const question = await ask(500);
		await prisma.question.update({
			where: { id: question.id },
			data: { question_is_awaiting_answer: false, question_answered: true },
		});

		const sent: Parameters<SendTransfer>[0][] = [];
		const notReady: SendTransfer = async () => null;
		const send: SendTransfer = async (input) => {
			sent.push(input);
			return "tr_test";
		};

		await settleCreditQuestion(question.id, notReady);
		expect((await prisma.question.findUniqueOrThrow({ where: { id: question.id } })).amount_already_withdraw).toBe(
			false,
		);

		await settleCreditQuestion(question.id, send);
		await settleCreditQuestion(question.id, send);
		expect(sent).toEqual([{ accountId: `acct_${run}`, amountCents: 250, questionId: question.id }]);
		expect((await prisma.question.findUniqueOrThrow({ where: { id: question.id } })).stripe_transfer_id).toBe(
			"tr_test",
		);
		expect(await credits()).toBe(0);
	});
});
