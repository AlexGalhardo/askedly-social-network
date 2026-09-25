import type { PrismaClient } from "../generated/prisma/client";
import { prisma } from "../prisma-client";

export const SeedDatabaseConfig = {
	// O Prisma não suporta `skipDuplicates` no SQLite (setups/*-sqlite.sh). Lá o SeedUniqueTracker já evita duplicata.
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
