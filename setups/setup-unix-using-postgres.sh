#!/usr/bin/env bash
# Local setup (Linux/macOS) using a Postgres already installed/running on the machine (no Docker).
# Usage: bash setups/setup-unix-using-postgres.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Checking Bun..."
if ! command -v bun >/dev/null 2>&1; then
	echo "Bun not found. Installing (curl -fsSL https://bun.sh/install | bash)..."
	curl -fsSL https://bun.sh/install | bash
	echo "Open a new terminal (or run 'source ~/.bashrc') and run this script again."
	exit 1
fi

echo "==> Installing dependencies (bun install)..."
bun install

if [ ! -f .env ]; then
	echo "==> Creating .env from .env.example..."
	cp .env.example .env
	echo "Edit .env with your local Postgres DATABASE_URL before continuing, if needed."
fi

DB_URL="$(grep '^DATABASE_URL=' .env | cut -d= -f2- | tr -d '"')"
echo "==> Using DATABASE_URL=${DB_URL}"

echo "==> Checking the Postgres connection..."
if ! command -v psql >/dev/null 2>&1; then
	echo "Warning: 'psql' not found in PATH. Skipping the connection check -- make sure Postgres is reachable."
else
	psql "$DB_URL" -c '\q' 2>/dev/null || {
		echo "Could not connect to ${DB_URL}."
		echo "Make sure Postgres is running and that the database exists (e.g. createdb askedly_db)."
		exit 1
	}
fi

echo "==> Generating the Prisma client and applying migrations..."
bun run prisma:generate
bun run prisma:migrate

echo "==> Populating the database with seed data..."
bun run prisma:db:seed

echo ""
echo "✅ Postgres (local) setup complete."
echo "   To run the app: bun run dev"
