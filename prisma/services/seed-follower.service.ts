import { faker } from "@faker-js/faker";
import type { PrismaClient } from "../generated/prisma/client";
import { SeedDatabaseConfig } from "../helpers/seed-database.helper";
import { SeedFollowerInterface, SeedUserInterface } from "../helpers/seed-interfaces.helper";
import { SeedLogger } from "../helpers/seed-logger.helper";
import { SeedUniqueTracker } from "../helpers/seed-unique-tracker.helper";

export class SeedFollowerService {
	constructor(
		private readonly prisma: PrismaClient,
		private readonly uniqueTracker: SeedUniqueTracker,
	) {}

	async createFollowerRelations(users: SeedUserInterface[], count: number): Promise<void> {
		const maxPossibleRelations = users.length * (users.length - 1);
		const actualCount = Math.min(count, maxPossibleRelations);

		if (actualCount < count) {
			SeedLogger.warning(
				`⚠️ Ajustando número de relações de ${count} para ${actualCount} (máximo possível com ${users.length} usuários)`,
			);
		}

		SeedLogger.info(`Criando ${actualCount} relações de seguidores...`);

		let created = 0;
		const relations: SeedFollowerInterface[] = [];
		let consecutiveFailures = 0;
		const maxConsecutiveFailures = 1000;

		while (created < actualCount && consecutiveFailures < maxConsecutiveFailures) {
			const followerUser = faker.helpers.arrayElement(users);
			const followingUser = faker.helpers.arrayElement(users);

			if (
				followerUser.id !== followingUser.id &&
				!this.uniqueTracker.isFollowRelationUsed(followerUser.id, followingUser.id)
			) {
				const relation: SeedFollowerInterface = {
					followerId: followerUser.id,
					followingId: followingUser.id,
				};

				relations.push(relation);
				this.uniqueTracker.addFollowRelation(followerUser.id, followingUser.id);
				created++;
				consecutiveFailures = 0;

				SeedLogger.info(
					`👥 Relação ${created}/${actualCount} preparada: @${followerUser.nickname} → @${followingUser.nickname}`,
				);

				if (relations.length >= 10 || created === actualCount) {
					SeedLogger.info(`💾 Salvando lote de ${relations.length} relações no banco...`);

					try {
						await this.prisma.follower.createMany({
							data: relations.map(({ followerId, followingId }) => ({
								followerId: followerId,
								followingId: followingId,
							})),
							...SeedDatabaseConfig.skipDuplicates,
						});

						for (const rel of relations) {
							const fUser = users.find((u) => u.id === rel.followerId);
							const fgUser = users.find((u) => u.id === rel.followingId);
							SeedLogger.success(`  ✅ Relação salva: @${fUser?.nickname} seguiu @${fgUser?.nickname}`);
						}

						relations.length = 0;
						SeedLogger.progress(created, actualCount, "Relações de seguidores criadas");
					} catch (error: any) {
						SeedLogger.error(`❌ Erro ao salvar lote: ${error}`);
						for (const rel of relations) {
							try {
								await this.prisma.follower.create({
									data: {
										followerId: rel.followerId,
										followingId: rel.followingId,
									},
								});
								const fUser = users.find((u) => u.id === rel.followerId);
								const fgUser = users.find((u) => u.id === rel.followingId);
								SeedLogger.success(
									`  ✅ Relação salva individualmente: @${fUser?.nickname} seguiu @${fgUser?.nickname}`,
								);
							} catch (individualError) {
								SeedLogger.warning(`⚠️ Erro individual: ${individualError}`);
							}
						}
						relations.length = 0;
					}
				}
			} else {
				consecutiveFailures++;
			}

			if (consecutiveFailures > 0 && consecutiveFailures % 100 === 0) {
				SeedLogger.warning(
					`⚠️ ${consecutiveFailures} tentativas consecutivas falharam. Pode estar esgotando combinações...`,
				);
			}
		}

		if (consecutiveFailures >= maxConsecutiveFailures) {
			SeedLogger.warning(
				`⚠️ Parou após ${maxConsecutiveFailures} tentativas consecutivas falhadas. Criadas ${created} relações.`,
			);
		}

		SeedLogger.success(`${created} relações de seguidores criadas!`);
	}
}
