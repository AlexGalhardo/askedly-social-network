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
				`⚠️ Adjusting number of relations from ${count} to ${actualCount} (maximum possible with ${users.length} users)`,
			);
		}

		SeedLogger.info(`Creating ${actualCount} follower relations...`);

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
					`👥 Relation ${created}/${actualCount} prepared: @${followerUser.nickname} → @${followingUser.nickname}`,
				);

				if (relations.length >= 10 || created === actualCount) {
					SeedLogger.info(`💾 Saving batch of ${relations.length} relations to the database...`);

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
							SeedLogger.success(
								`  ✅ Relation saved: @${fUser?.nickname} followed @${fgUser?.nickname}`,
							);
						}

						relations.length = 0;
						SeedLogger.progress(created, actualCount, "Follower relations created");
					} catch (error: any) {
						SeedLogger.error(`❌ Error saving batch: ${error}`);
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
									`  ✅ Relation saved individually: @${fUser?.nickname} followed @${fgUser?.nickname}`,
								);
							} catch (individualError) {
								SeedLogger.warning(`⚠️ Individual error: ${individualError}`);
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
					`⚠️ ${consecutiveFailures} consecutive attempts failed. Combinations may be running out...`,
				);
			}
		}

		if (consecutiveFailures >= maxConsecutiveFailures) {
			SeedLogger.warning(
				`⚠️ Stopped after ${maxConsecutiveFailures} consecutive failed attempts. Created ${created} relations.`,
			);
		}

		SeedLogger.success(`${created} follower relations created!`);
	}
}
