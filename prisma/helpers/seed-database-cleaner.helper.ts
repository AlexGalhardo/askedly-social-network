import type { PrismaClient } from "../generated/prisma/client";

export class SeedDatabaseCleaner {
	constructor(private readonly prisma: PrismaClient) {}

	async cleanAll(): Promise<void> {
		console.log("Cleaning existing tables...");

		await this.prisma.question.deleteMany();
		await this.prisma.paymentWithdraw.deleteMany();
		await this.prisma.stripePurchase.deleteMany();
		console.log("Table 'question' cleaned");

		await this.prisma.webhookAbacatePay.deleteMany();
		console.log("Table 'webhookAbacatePay' cleaned");

		await this.prisma.follower.deleteMany();
		console.log("Table 'follower' cleaned");

		await this.prisma.followRequest.deleteMany();
		console.log("Table 'followRequest' cleaned");

		await this.prisma.deletedAccount.deleteMany();
		console.log("Table 'deletedAccount' cleaned");

		await this.prisma.user.deleteMany();
		console.log("Table 'user' cleaned");
	}
}
