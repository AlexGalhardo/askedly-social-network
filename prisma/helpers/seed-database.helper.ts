import { PrismaClient } from "@prisma/client";

export class SeedDatabaseConfig {
	private static instance: PrismaClient;

	static getInstance(): PrismaClient {
		if (!this.instance) {
			this.instance = new PrismaClient();
		}
		return this.instance;
	}

	static async disconnect(): Promise<void> {
		if (this.instance) {
			await this.instance.$disconnect();
		}
	}
}
