import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DATABASE_URL;
// `file:` = SQLite local sem Postgres (setups/*-sqlite.sh). Schema espelhado, sem migrations: usa `prisma db push`.
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
