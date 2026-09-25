import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

function createPrismaClient(): PrismaClient {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error("DATABASE_URL não definida (veja .env.example)");

	// `file:` = SQLite local (setups/*-sqlite.sh), com client gerado de schema.sqlite.prisma.
	// libSQL em vez de better-sqlite3 porque este não roda no Bun (seed e scripts).
	const adapter = url.startsWith("file:") ? new PrismaLibSql({ url }) : new PrismaPg({ connectionString: url });

	return new PrismaClient({ adapter });
}

// O `next dev` reavalia módulos a cada hot reload; sem isso cada edição abriria um pool de conexões novo.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
