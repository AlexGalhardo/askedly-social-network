import type { PrismaClient } from "../generated/prisma/client";
import { prisma } from "../prisma-client";

export const SeedDatabaseConfig = {
	// Prisma does not support `skipDuplicates` on SQLite (setups/*-sqlite.sh). There the SeedUniqueTracker already prevents duplicates.
	skipDuplicates: (process.env.DATABASE_URL?.startsWith("file:") ? {} : { skipDuplicates: true }) as {
		skipDuplicates?: boolean;
	},

	getInstance(): PrismaClient {
		return prisma;
	},

	async disconnect(): Promise<void> {
		await prisma.$disconnect();
	},
};
