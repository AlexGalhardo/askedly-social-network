import { faker } from "@faker-js/faker";
import type { PrismaClient } from "../generated/prisma/client";
import { SeedLogger } from "../helpers/seed-logger.helper";

interface SeedUserRef {
	id: string;
	nickname: string;
}

const CREDIT_AMOUNTS = [500, 1000, 2000, 5000, 10000];
const QUESTION_AMOUNTS = [200, 500, 1000, 2000, 5000];

/**
 * Dados de pagamento para o painel do admin e para as telas de créditos: compras na Stripe, perguntas pagas com
 * créditos em todos os estados, perguntas PIX recebidas pelo admin e um saque. Nada aqui chama a Stripe.
 */
export class SeedPaymentsDemoService {
	constructor(private readonly prisma: PrismaClient) {}

	async create(users: SeedUserRef[]): Promise<void> {
		SeedLogger.info("Criando dados de pagamento de demonstração (Stripe, créditos, saque do admin)...");

		const admin = await this.prisma.user.update({
			where: { email: "admin@gmail.com" },
			data: { credits_cents: 5000, stripe_account_id: "acct_sim_admin", pix_key: "admin@gmail.com" },
			select: { id: true, nickname: true },
		});
		const buyers = [admin, ...faker.helpers.arrayElements(users, Math.min(12, users.length))];

		await this.prisma.stripePurchase.createMany({
			data: buyers.flatMap((buyer, index) => [
				{
					user_id: buyer.id,
					checkout_session_id: `cs_seed_${index}_paid`,
					amount_cents: faker.helpers.arrayElement(CREDIT_AMOUNTS),
					status: "completed",
					created_at: faker.date.recent({ days: 30 }),
				},
				...(index % 4 === 0
					? [
							{
								user_id: buyer.id,
								checkout_session_id: `cs_seed_${index}_expired`,
								amount_cents: faker.helpers.arrayElement(CREDIT_AMOUNTS),
								status: "expired",
								created_at: faker.date.recent({ days: 30 }),
							},
						]
					: []),
			]),
		});

		// Perguntas em créditos: respondidas (já transferidas), aguardando e recusadas (créditos já devolvidos).
		const states = ["answered", "answered", "awaiting", "refused"] as const;
		for (let i = 0; i < 24; i++) {
			const state = states[i % states.length];
			const owner = i % 3 === 0 ? admin : faker.helpers.arrayElement(users);
			const asker = faker.helpers.arrayElement(users.filter((user) => user.id !== owner.id));
			await this.prisma.question.create({
				data: {
					is_seed: true,
					question_text: faker.lorem.sentence({ min: 8, max: 16 }).replace(/\.$/, "?"),
					amount_paid: faker.helpers.arrayElement(QUESTION_AMOUNTS),
					currency: "USD",
					owner_user_nickname: owner.nickname,
					asked_by_user_nickname: asker.nickname,
					liked_by_users: "[]",
					desliked_by_users: "[]",
					question_is_awaiting_answer: state === "awaiting",
					question_answered: state === "answered",
					question_answer_was_recused: state === "refused",
					answer_text: state === "answered" ? faker.lorem.paragraph() : null,
					answered_at: state === "answered" ? new Date() : null,
					amount_already_withdraw: state !== "awaiting",
					stripe_transfer_id: state === "answered" ? `tr_seed_${i}` : null,
				},
			});
		}

		const pixQuestionIds: string[] = [];
		for (let i = 0; i < 6; i++) {
			const amount = faker.helpers.arrayElement([1000, 2000, 5000, 10000]);
			const asker = faker.helpers.arrayElement(users);
			const webhook = await this.prisma.webhookAbacatePay.create({
				data: {
					is_seed: true,
					pix_id: `pix_seed_admin_${i}`,
					status: "PAID",
					amount,
					fee: 0,
					kind: "transparent",
					event_status: "transparent.completed",
					dev_mode: true,
					complete_event: "{}",
					userId: asker.id,
				},
			});
			const question = await this.prisma.question.create({
				data: {
					is_seed: true,
					question_text: faker.lorem.sentence({ min: 8, max: 16 }).replace(/\.$/, "?"),
					answer_text: faker.lorem.paragraph(),
					answered_at: new Date(),
					amount_paid: amount,
					owner_user_nickname: admin.nickname,
					asked_by_user_nickname: asker.nickname,
					liked_by_users: "[]",
					desliked_by_users: "[]",
					question_is_awaiting_answer: false,
					question_answered: true,
					webhook_id: webhook.id,
				},
			});
			pixQuestionIds.push(question.id);
		}

		// Um saque já feito, para o histórico: marca duas perguntas PIX do admin como sacadas.
		const withdrawn = await this.prisma.question.findMany({
			where: { id: { in: pixQuestionIds.slice(0, 2) } },
			select: { id: true, amount_paid: true },
		});
		await this.prisma.paymentWithdraw.create({
			data: {
				user_id: admin.id,
				user_nickname: admin.nickname,
				send_to_pix_key: "admin@gmail.com",
				amount_withdraw: withdrawn.reduce(
					(total, question) => total + Math.ceil(question.amount_paid * 0.7),
					0,
				),
				questions: { connect: withdrawn.map(({ id }) => ({ id })) },
			},
		});
		await this.prisma.question.updateMany({
			where: { id: { in: withdrawn.map(({ id }) => id) } },
			data: { amount_already_withdraw: true },
		});

		SeedLogger.success("Dados de pagamento de demonstração criados!");
	}
}
