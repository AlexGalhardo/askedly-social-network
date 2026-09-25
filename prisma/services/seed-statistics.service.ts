import type { PrismaClient } from "../generated/prisma/client";
import { SeedLogger } from "../helpers/seed-logger.helper";

export class SeedStatisticsService {
	constructor(private readonly prisma: PrismaClient) {}

	async generateReport(): Promise<void> {
		SeedLogger.header("ESTATÍSTICAS FINAIS DO SEED");

		const users = await this.prisma.user.count();
		const followers = await this.prisma.follower.count();
		const questions = await this.prisma.question.count();
		const webhooks = await this.prisma.webhookAbacatePay.count();

		SeedLogger.info(`Concluído em: ${new Date().toISOString()}`);
		SeedLogger.info(`👥 Total de usuários criados: ${users}`);
		SeedLogger.info(`🔗 Total de relações de seguidores: ${followers}`);
		SeedLogger.info(`❓ Total de perguntas criadas: ${questions}`);
		SeedLogger.info(`💳 Total de webhooks criados: ${webhooks}`);

		await this.generateQuestionStatistics();
		await this.generateUserStatistics();
		await this.generateIntegrityCheck();

		SeedLogger.separator();
		SeedLogger.success("🎊 SEED FINALIZADO COM SUCESSO! 🎊");
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

		SeedLogger.info("\n📈 DISTRIBUIÇÃO DE ESTADOS DAS PERGUNTAS:");
		SeedLogger.info(`✅ Perguntas respondidas: ${answered} (${Math.round((answered / total) * 100)}%)`);
		SeedLogger.info(`⏳ Perguntas aguardando: ${waiting} (${Math.round((waiting / total) * 100)}%)`);
		SeedLogger.info(`❌ Perguntas recusadas: ${refused} (${Math.round((refused / total) * 100)}%)`);
		SeedLogger.info(`⏰ Perguntas expiradas: ${expired} (${Math.round((expired / total) * 100)}%)`);

		const totalValue = await this.prisma.question.aggregate({
			_sum: { amount_paid: true },
		});

		SeedLogger.info(`💰 Valor total das perguntas: R$ ${((totalValue._sum.amount_paid || 0) / 100).toFixed(2)}`);
	}

	private async generateUserStatistics(): Promise<void> {
		const usersWithQuestions = await this.prisma.question.groupBy({
			by: ["owner_user_nickname"],
		});

		const usersWhoAsked = await this.prisma.question.groupBy({
			by: ["asked_by_user_nickname"],
		});

		const totalUsers = await this.prisma.user.count();

		SeedLogger.info("\n👤 ESTATÍSTICAS DE USUÁRIOS:");
		SeedLogger.info(`📝 Usuários que receberam perguntas: ${usersWithQuestions.length}/${totalUsers}`);
		SeedLogger.info(`❓ Usuários que fizeram perguntas: ${usersWhoAsked.length}/${totalUsers}`);
	}

	private async generateIntegrityCheck(): Promise<void> {
		const questionsCount = await this.prisma.question.count();
		const webhooksCount = await this.prisma.webhookAbacatePay.count();

		SeedLogger.info("\n🔍 VERIFICAÇÃO DE INTEGRIDADE:");
		SeedLogger.info(`🔗 Perguntas: ${questionsCount} | Webhooks: ${webhooksCount}`);

		if (questionsCount === webhooksCount) {
			SeedLogger.success("✅ Todos os webhooks estão corretamente vinculados às perguntas!");
		} else {
			SeedLogger.warning("⚠️ Alguns webhooks podem não estar vinculados corretamente!");
		}
	}
}
