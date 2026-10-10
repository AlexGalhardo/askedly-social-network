#!/usr/bin/env bash
# Local setup (Windows, via Git Bash) using a Postgres already installed/running on the machine (no Docker).
# Usage: bash setups/setup-windows-using-postgres.sh
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
	echo "Edit .env with your local Postgres DATABASE_URL before continuing, if needed."
fi

DB_URL="$(grep '^DATABASE_URL=' .env | cut -d= -f2- | tr -d '"')"
echo "==> Using DATABASE_URL=${DB_URL}"

echo "==> Checking the Postgres connection..."
if ! command -v psql >/dev/null 2>&1; then
	echo "Warning: 'psql' not found in PATH (normal on Windows installs without the command line package)."
	echo "Skipping the connection check -- make sure Postgres (e.g. PostgreSQL installed via the official installer) is reachable."
else
	psql "$DB_URL" -c '\q' 2>/dev/null || {
		echo "Could not connect to ${DB_URL}."
		echo "Make sure the Postgres service is running (services.msc) and that the database exists."
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
