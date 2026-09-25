import { faker } from "@faker-js/faker";
import { SeedQuestionFactory } from "../factories/seed-question.factory";
import { SeedWebhookFactory } from "../factories/seed-webhook.factory";
import type { PrismaClient } from "../generated/prisma/client";
import { SeedHelpers } from "../helpers/seed-helpers.helper";
import { SeedQuestionStateType, SeedUserInterface } from "../helpers/seed-interfaces.helper";
import { SeedLogger } from "../helpers/seed-logger.helper";

export class SeedQuestionService {
	constructor(private readonly prisma: PrismaClient) {}

	async createGuaranteedQuestions(users: SeedUserInterface[]): Promise<void> {
		SeedLogger.info("Criando perguntas garantidas para cada usuário...");

		const questionStates: SeedQuestionStateType[] = ["answered", "waiting", "refused", "expired"];
		const questionsPerState = 3;
		const totalQuestions = users.length * questionStates.length * questionsPerState;
		let created = 0;

		for (let userIndex = 0; userIndex < users.length; userIndex++) {
			const ownerUser = users[userIndex];
			SeedLogger.info(`👤 Processando usuário ${userIndex + 1}/${users.length}: @${ownerUser.nickname}`);

			for (let stateIndex = 0; stateIndex < questionStates.length; stateIndex++) {
				const state = questionStates[stateIndex];
				SeedLogger.info(`  📊 Criando 3 perguntas no estado: ${state}`);

				for (let i = 0; i < questionsPerState; i++) {
					const askerUser = this.getRandomAskerUser(users, ownerUser);
					const amount = SeedHelpers.generateRandomAmount();
					const pixId = SeedHelpers.generatePixId();

					SeedLogger.info(
						`    🔄 Pergunta ${created + 1}/${totalQuestions}: @${askerUser.nickname} → @${ownerUser.nickname} (${state}) - R$ ${(amount / 100).toFixed(2)}`,
					);

					const webhookData = SeedWebhookFactory.create(pixId, amount);
					SeedLogger.info(`      💳 Criando webhook: ${pixId}`);

					const webhook = await this.prisma.webhookAbacatePay.create({
						data: {
							pix_id: webhookData.pix_id,
							status: webhookData.status,
							amount: webhookData.amount,
							fee: webhookData.fee,
							kind: webhookData.kind ?? "default_kind",
							event_status: webhookData.event_status ?? "default_event_status",
							dev_mode: webhookData.dev_mode ?? false,
							complete_event: webhookData.complete_event ?? false,
						},
					});

					SeedLogger.success(`      ✅ Webhook criado: ${webhook.id}`);

					const questionData = SeedQuestionFactory.create(
						ownerUser,
						askerUser,
						webhook.id,
						amount,
						state,
						users,
					);

					SeedLogger.info(`      ❓ Criando pergunta: "${questionData.question_text.substring(0, 50)}..."`);

					const { owner_user_nickname, asked_by_user_nickname, webhook_id, ...questionDataWithoutNickname } =
						questionData;
					await this.prisma.question.create({
						data: {
							...questionDataWithoutNickname,
							webhook: { connect: { id: webhook.id } },
							owner: { connect: { id: ownerUser.id.toString() } },
							asked_by: { connect: { id: askerUser.id.toString() } },
						},
					});

					created++;
					SeedLogger.success(`      ✅ Pergunta ${created}/${totalQuestions} criada com sucesso!`);

					if (created % 100 === 0) {
						SeedLogger.progress(created, totalQuestions, "Perguntas garantidas criadas");
					}
				}
			}
		}

		SeedLogger.success(`${created} perguntas garantidas criadas!`);
	}

	async createRandomQuestions(users: SeedUserInterface[], count: number): Promise<void> {
		SeedLogger.info(`Criando ${count} perguntas aleatórias...`);

		let created = 0;

		for (let i = 0; i < count; i++) {
			const ownerUser = faker.helpers.arrayElement(users);
			const askerUser = this.getRandomAskerUser(users, ownerUser);
			const state = this.getRandomQuestionState();
			const amount = SeedHelpers.generateRandomAmount();
			const pixId = SeedHelpers.generatePixId();

			SeedLogger.info(
				`🔄 Pergunta aleatória ${i + 1}/${count}: @${askerUser.nickname} → @${ownerUser.nickname} (${state}) - R$ ${(amount / 100).toFixed(2)}`,
			);

			const webhookData = SeedWebhookFactory.create(pixId, amount);
			SeedLogger.info(`  💳 Criando webhook: ${pixId}`);

			const webhook = await this.prisma.webhookAbacatePay.create({
				data: {
					pix_id: webhookData.pix_id,
					status: webhookData.status,
					amount: webhookData.amount,
					fee: webhookData.fee,
					kind: webhookData.kind ?? "default_kind",
					event_status: webhookData.event_status ?? "default_event_status",
					dev_mode: webhookData.dev_mode ?? false,
					complete_event: webhookData.complete_event ?? false,
				},
			});

			SeedLogger.success(`  ✅ Webhook criado: ${webhook.id}`);

			const questionData = SeedQuestionFactory.create(ownerUser, askerUser, webhook.id, amount, state, users);
			SeedLogger.info(`  ❓ Criando pergunta: "${questionData.question_text.substring(0, 50)}..."`);

			const { owner_user_nickname, asked_by_user_nickname, webhook_id, ...questionDataWithoutNickname } =
				questionData;
			await this.prisma.question.create({
				data: {
					...questionDataWithoutNickname,
					webhook: { connect: { id: webhook.id } },
					owner: { connect: { id: ownerUser.id.toString() } },
					asked_by: { connect: { id: askerUser.id.toString() } },
				},
			});

			created++;
			SeedLogger.success(`  ✅ Pergunta aleatória ${created}/${count} criada com sucesso!`);

			if (created % 50 === 0) {
				SeedLogger.progress(created, count, "Perguntas aleatórias criadas");
			}
		}

		SeedLogger.success(`${created} perguntas aleatórias criadas!`);
	}

	private getRandomAskerUser(users: SeedUserInterface[], ownerUser: SeedUserInterface): SeedUserInterface {
		let askerUser: SeedUserInterface;
		do {
			askerUser = faker.helpers.arrayElement(users);
		} while (askerUser.id === ownerUser.id);

		return askerUser;
	}

	private getRandomQuestionState(): SeedQuestionStateType {
		return faker.helpers.weightedArrayElement([
			{ weight: 70, value: "answered" as SeedQuestionStateType },
			{ weight: 15, value: "waiting" as SeedQuestionStateType },
			{ weight: 10, value: "refused" as SeedQuestionStateType },
			{ weight: 5, value: "expired" as SeedQuestionStateType },
		]);
	}
}
