import type { PrismaClient } from "../generated/prisma/client";

export class SeedDatabaseCleaner {
	constructor(private readonly prisma: PrismaClient) {}

	async cleanAll(): Promise<void> {
		console.log("Limpando tabelas existentes...");

		await this.prisma.question.deleteMany();
		console.log("Tabela 'question' limpa");

		await this.prisma.webhookAbacatePay.deleteMany();
		console.log("Tabela 'webhookAbacatePay' limpa");

		await this.prisma.follower.deleteMany();
		console.log("Tabela 'follower' limpa");

		await this.prisma.followRequest.deleteMany();
		console.log("Tabela 'followRequest' limpa");

		await this.prisma.deletedAccount.deleteMany();
		console.log("Tabela 'deletedAccount' limpa");

		await this.prisma.user.deleteMany();
		console.log("Tabela 'user' limpa");
	}
}
