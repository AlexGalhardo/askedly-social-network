import type { PrismaClient } from "../generated/prisma/client";
import { SeedLogger } from "../helpers/seed-logger.helper";

export class SeedStatisticsService {
	constructor(private readonly prisma: PrismaClient) {}

	async generateReport(): Promise<void> {
		SeedLogger.header("FINAL SEED STATISTICS");

		const users = await this.prisma.user.count();
		const followers = await this.prisma.follower.count();
		const questions = await this.prisma.question.count();
		const webhooks = await this.prisma.webhookAbacatePay.count();

		SeedLogger.info(`Finished at: ${new Date().toISOString()}`);
		SeedLogger.info(`👥 Total users created: ${users}`);
		SeedLogger.info(`🔗 Total follower relations: ${followers}`);
		SeedLogger.info(`❓ Total questions created: ${questions}`);
		SeedLogger.info(`💳 Total webhooks created: ${webhooks}`);

		await this.generateQuestionStatistics();
		await this.generateUserStatistics();
		await this.generateIntegrityCheck();

		SeedLogger.separator();
		SeedLogger.success("🎊 SEED FINISHED SUCCESSFULLY! 🎊");
		SeedLogger.separator();
	}

	private async generateQuestionStatistics(): Promise<void> {
		const answered = await this.prisma.question.count({
			where: { question_answered: true },
		});

		const waiting = await this.prisma.question.count({
			where: { question_is_awaiting_answer: true },
		});

		const refused = await this.prisma.question.count({
			where: { question_answer_was_recused: true },
		});

		const expired = await this.prisma.question.count({
			where: { question_answer_was_expired: true },
		});

		const total = answered + waiting + refused + expired;

		SeedLogger.info("\n📈 QUESTION STATE DISTRIBUTION:");
		SeedLogger.info(`✅ Answered questions: ${answered} (${Math.round((answered / total) * 100)}%)`);
		SeedLogger.info(`⏳ Waiting questions: ${waiting} (${Math.round((waiting / total) * 100)}%)`);
		SeedLogger.info(`❌ Declined questions: ${refused} (${Math.round((refused / total) * 100)}%)`);
		SeedLogger.info(`⏰ Expired questions: ${expired} (${Math.round((expired / total) * 100)}%)`);

		const totalValue = await this.prisma.question.aggregate({
			_sum: { amount_paid: true },
		});

		SeedLogger.info(`💰 Total value of questions: R$ ${((totalValue._sum.amount_paid || 0) / 100).toFixed(2)}`);
	}

	private async generateUserStatistics(): Promise<void> {
		const usersWithQuestions = await this.prisma.question.groupBy({
			by: ["owner_user_nickname"],
		});

		const usersWhoAsked = await this.prisma.question.groupBy({
			by: ["asked_by_user_nickname"],
		});

		const totalUsers = await this.prisma.user.count();

		SeedLogger.info("\n👤 USER STATISTICS:");
		SeedLogger.info(`📝 Users who received questions: ${usersWithQuestions.length}/${totalUsers}`);
		SeedLogger.info(`❓ Users who asked questions: ${usersWhoAsked.length}/${totalUsers}`);
	}

	private async generateIntegrityCheck(): Promise<void> {
		const questionsCount = await this.prisma.question.count();
		const webhooksCount = await this.prisma.webhookAbacatePay.count();

		SeedLogger.info("\n🔍 INTEGRITY CHECK:");
		SeedLogger.info(`🔗 Questions: ${questionsCount} | Webhooks: ${webhooksCount}`);

		if (questionsCount === webhooksCount) {
			SeedLogger.success("✅ All webhooks are correctly linked to the questions!");
		} else {
			SeedLogger.warning("⚠️ Some webhooks may not be linked correctly!");
		}
	}
}
