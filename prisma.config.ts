import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL;
// `file:` = local SQLite without Postgres (setups/*-sqlite.sh). Mirrored schema, no migrations: uses `prisma db push`.
const isSqlite = databaseUrl?.startsWith("file:") ?? false;

export default defineConfig({
	schema: isSqlite ? "prisma/schema.sqlite.prisma" : "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
		seed: "bun prisma/seed.ts",
	},
	datasource: {
		url: databaseUrl,
	},
});
