import type { PrismaClient } from "../generated/prisma/client";
import { prisma } from "../prisma-client";

export class SeedDatabaseConfig {
	static getInstance(): PrismaClient {
		return prisma;
	}

	static async disconnect(): Promise<void> {
		await prisma.$disconnect();
	}
}
