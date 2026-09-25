import type { PrismaClient } from "../generated/prisma/client";
import { prisma } from "../prisma-client";

export const SeedDatabaseConfig = {
	getInstance(): PrismaClient {
		return prisma;
	},

	async disconnect(): Promise<void> {
		await prisma.$disconnect();
	},
};
