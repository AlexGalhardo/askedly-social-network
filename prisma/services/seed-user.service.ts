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
		SeedLogger.info("Criando usuários do sistema...");

		const officialUserData = await this.userFactory.createOfficialUser();
		SeedLogger.info(`🔄 Criando usuário oficial: ${officialUserData.name} (@${officialUserData.nickname})`);

		const officialUser = await this.prisma.user.create({
			data: {
				...officialUserData,
			},
		});
		SeedLogger.success(`✅ Usuário oficial criado: ${officialUser.name} (@${officialUser.nickname})`);

		const adminUserData = await this.userFactory.createAdminUser();
		SeedLogger.info(`🔄 Criando usuário admin: ${adminUserData.name} (@${adminUserData.nickname})`);

		const adminUser = await this.prisma.user.create({
			data: {
				...adminUserData,
			},
		});
		SeedLogger.success(`✅ Usuário admin criado: ${adminUser.name} (@${adminUser.nickname})`);

		SeedLogger.success("Usuários do sistema criados!");

		return [
			{ ...officialUser, id: officialUser.id, password: officialUser.password ?? "" },
			{ ...adminUser, id: adminUser.id, password: adminUser.password ?? "" },
		];
	}

	async createRandomUsers(count: number): Promise<SeedUserInterface[]> {
		SeedLogger.info(`Criando ${count} usuários aleatórios...`);

		const users: SeedUserInterface[] = [];
		const batchSize = 100;
		let totalCreated = 0;

		for (let i = 0; i < count; i += batchSize) {
			const currentBatchSize = Math.min(batchSize, count - i);
			const batch: Omit<SeedUserInterface, "id">[] = [];

			SeedLogger.info(`🔄 Preparando lote ${Math.floor(i / batchSize) + 1} com ${currentBatchSize} usuários...`);

			for (let j = 0; j < currentBatchSize; j++) {
				const userData = await this.userFactory.createRandomUser();
				batch.push(userData);

				SeedLogger.info(
					`  📝 Usuário ${totalCreated + j + 1}/${count} preparado: ${userData.name} (@${userData.nickname})`,
				);
			}

			SeedLogger.info(`💾 Salvando lote de ${currentBatchSize} usuários no banco...`);

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
				SeedLogger.success(`  ✅ Usuário ${totalCreated}/${count} salvo: ${user.name} (@${user.nickname})`);
			}

			users.push(
				...batchUsers.map((user) => ({
					...user,
					id: user.id,
					password: user.password ?? "",
				})),
			);

			SeedLogger.progress(totalCreated, count, "Usuários criados");
		}

		SeedLogger.success(`${users.length} usuários aleatórios criados!`);

		return users;
	}
}
