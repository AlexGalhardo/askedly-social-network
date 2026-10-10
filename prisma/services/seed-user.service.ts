import { SeedUserFactory } from "../factories/seed-user.factory";
import type { PrismaClient } from "../generated/prisma/client";
import { SeedDatabaseConfig } from "../helpers/seed-database.helper";
import { SeedUserInterface } from "../helpers/seed-interfaces.helper";
import { SeedLogger } from "../helpers/seed-logger.helper";
import { SeedUniqueTracker } from "../helpers/seed-unique-tracker.helper";

export class SeedUserService {
	private readonly userFactory: SeedUserFactory;

	constructor(
		private readonly prisma: PrismaClient,
		uniqueTracker: SeedUniqueTracker,
	) {
		this.userFactory = new SeedUserFactory(uniqueTracker);
	}

	async createSystemUsers(): Promise<SeedUserInterface[]> {
		SeedLogger.info("Creating system users...");

		const officialUserData = await this.userFactory.createOfficialUser();
		SeedLogger.info(`🔄 Creating official user: ${officialUserData.name} (@${officialUserData.nickname})`);

		const officialUser = await this.prisma.user.create({
			data: {
				...officialUserData,
			},
		});
		SeedLogger.success(`✅ Official user created: ${officialUser.name} (@${officialUser.nickname})`);

		const adminUserData = await this.userFactory.createAdminUser();
		SeedLogger.info(`🔄 Creating admin user: ${adminUserData.name} (@${adminUserData.nickname})`);

		const adminUser = await this.prisma.user.create({
			data: {
				...adminUserData,
			},
		});
		SeedLogger.success(`✅ Admin user created: ${adminUser.name} (@${adminUser.nickname})`);

		SeedLogger.success("System users created!");

		return [
			{ ...officialUser, id: officialUser.id, password: officialUser.password ?? "" },
			{ ...adminUser, id: adminUser.id, password: adminUser.password ?? "" },
		];
	}

	async createRandomUsers(count: number): Promise<SeedUserInterface[]> {
		SeedLogger.info(`Creating ${count} random users...`);

		const users: SeedUserInterface[] = [];
		const batchSize = 100;
		let totalCreated = 0;

		for (let i = 0; i < count; i += batchSize) {
			const currentBatchSize = Math.min(batchSize, count - i);
			const batch: Omit<SeedUserInterface, "id">[] = [];

			SeedLogger.info(`🔄 Preparing batch ${Math.floor(i / batchSize) + 1} with ${currentBatchSize} users...`);

			for (let j = 0; j < currentBatchSize; j++) {
				const userData = await this.userFactory.createRandomUser();
				batch.push(userData);

				SeedLogger.info(
					`  📝 User ${totalCreated + j + 1}/${count} prepared: ${userData.name} (@${userData.nickname})`,
				);
			}

			SeedLogger.info(`💾 Saving batch of ${currentBatchSize} users to the database...`);

			await this.prisma.user.createMany({
				data: batch,
				...SeedDatabaseConfig.skipDuplicates,
			});

			const batchUsers = await this.prisma.user.findMany({
				where: {
					nickname: {
						in: batch.map((u) => u.nickname),
					},
				},
			});

			for (const user of batchUsers) {
				totalCreated++;
				SeedLogger.success(`  ✅ User ${totalCreated}/${count} saved: ${user.name} (@${user.nickname})`);
			}

			users.push(
				...batchUsers.map((user) => ({
					...user,
					id: user.id,
					password: user.password ?? "",
				})),
			);

			SeedLogger.progress(totalCreated, count, "Users created");
		}

		SeedLogger.success(`${users.length} random users created!`);

		return users;
	}
}
