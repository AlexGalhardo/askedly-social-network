import { SeedDatabaseConfig } from "./helpers/seed-database.helper";
import { SeedDatabaseCleaner } from "./helpers/seed-database-cleaner.helper";
import { SeedEnvironment } from "./helpers/seed-environment.helper";
import { SeedLogger } from "./helpers/seed-logger.helper";
import { SeedUniqueTracker } from "./helpers/seed-unique-tracker.helper";
import { SeedFollowerService } from "./services/seed-follower.service";
import { SeedQuestionService } from "./services/seed-question.service";
import { SeedStatisticsService } from "./services/seed-statistics.service";
import { SeedUserService } from "./services/seed-user.service";

export class SeedOrchestrator {
	private readonly prisma = SeedDatabaseConfig.getInstance();
	private readonly uniqueTracker = new SeedUniqueTracker();
	private readonly config = SeedEnvironment.getConfig();

	private readonly databaseCleaner = new SeedDatabaseCleaner(this.prisma);
	private readonly userService = new SeedUserService(this.prisma, this.uniqueTracker);
	private readonly followerService = new SeedFollowerService(this.prisma, this.uniqueTracker);
	private readonly questionService = new SeedQuestionService(this.prisma);
	private readonly statisticsService = new SeedStatisticsService(this.prisma);

	async execute(): Promise<void> {
		try {
			SeedLogger.header("INICIANDO PROCESSO DE SEED DO BANCO DE DADOS");
			SeedLogger.info(`Timestamp: ${new Date().toISOString()}`);
			SeedLogger.info(`Configuração: ${JSON.stringify(this.config, null, 2)}`);

			await this.databaseCleaner.cleanAll();

			await this.userService.createSystemUsers();

			const randomUsers = await this.userService.createRandomUsers(this.config.totalUsers);
			const allUsers = [...randomUsers];

			await this.followerService.createFollowerRelations(allUsers, this.config.totalFollowers);

			await this.questionService.createGuaranteedQuestions(allUsers);

			await this.questionService.createRandomQuestions(allUsers, this.config.totalQuestions);

			await this.statisticsService.generateReport();
		} catch (error: any) {
			SeedLogger.error("ERRO DURANTE O PROCESSO DE SEED:");
			SeedLogger.error(`Detalhes: ${error}`);
			SeedLogger.error(`Stack trace: ${(error as Error).stack}`);
			SeedLogger.error(`Timestamp: ${new Date().toISOString()}`);
			process.exit(1);
		} finally {
			SeedLogger.info("Desconectando do banco de dados...");
			await SeedDatabaseConfig.disconnect();
			SeedLogger.success("Desconexão realizada com sucesso!");
			SeedLogger.info("👋 Processo finalizado!");
		}
	}
}
