import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

function createPrismaClient(): PrismaClient {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");

	// `file:` = local SQLite (setups/*-sqlite.sh), with the client generated from schema.sqlite.prisma.
	// libSQL instead of better-sqlite3 because the latter does not run on Bun (seed and scripts).
	const adapter = url.startsWith("file:") ? new PrismaLibSql({ url }) : new PrismaPg({ connectionString: url });

	return new PrismaClient({ adapter });
}

// `next dev` re-evaluates modules on every hot reload; without this each edit would open a new connection pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
