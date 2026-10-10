#!/usr/bin/env bash
# Local setup (Windows, via Git Bash) using SQLite -- no Postgres, no Docker.
# Usage: bash setups/setup-windows-using-sqlite.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Checking Bun..."
if ! command -v bun >/dev/null 2>&1; then
	echo "Bun not found. Install it by running in PowerShell:"
	echo '  powershell -c "irm bun.sh/install.ps1 | iex"'
	echo "Then open a new Git Bash terminal and run this script again."
	exit 1
fi

echo "==> Installing dependencies (bun install)..."
bun install

if [ ! -f .env ]; then
	echo "==> Creating .env from .env.example..."
	cp .env.example .env
fi

echo "==> Pointing DATABASE_URL to SQLite (file:./dev.db)..."
sed -i.bak '/^DATABASE_URL=/d' .env && rm -f .env.bak
echo 'DATABASE_URL="file:./dev.db"' >>.env

echo "==> Generating the client and syncing the SQLite schema (prisma/schema.sqlite.prisma)..."
# prisma.config.ts selects schema.sqlite.prisma because DATABASE_URL starts with `file:`.
bunx prisma generate
bunx prisma db push

echo "==> Populating the database with seed data..."
bunx prisma db seed || {
	echo "Warning: the seed uses createMany({ skipDuplicates }), which SQLite does not support (see PLAN.md, Phase 11)."
	echo "The database was created empty; register users through the app."
}

echo ""
echo "✅ SQLite setup complete. Database at: .\\dev.db"
echo "   Reminder: prisma/schema.sqlite.prisma is a manual mirror of prisma/schema.prisma (see docs/database.md)."
echo "   To run the app: bun run dev"
