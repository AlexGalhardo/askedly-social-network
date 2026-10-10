#!/usr/bin/env bash
# Local setup (Linux/macOS) using Postgres via Docker Compose (infra/docker-compose.yaml).
# Usage: bash setups/setup-unix-using-postgres-with-docker.sh
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

echo "==> Checking Docker..."
if ! command -v docker >/dev/null 2>&1; then
	echo "Docker not found. Install Docker Engine/Docker Desktop before continuing: https://docs.docker.com/get-docker/"
	exit 1
fi

echo "==> Installing dependencies (bun install)..."
bun install

if [ ! -f .env ]; then
	echo "==> Creating .env from .env.example..."
	cp .env.example .env
fi

echo "==> Starting Postgres (infra/docker-compose.yaml)..."
docker compose -f infra/docker-compose.yaml up -d

echo "==> Waiting for Postgres to become healthy..."
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose -f infra/docker-compose.yaml ps -q askedly_db)" 2>/dev/null)" = "healthy" ]; do
	sleep 1
done

echo "==> Generating the Prisma client and applying migrations..."
bun run prisma:generate
bun run prisma:migrate

echo "==> Populating the database with seed data..."
bun run prisma:db:seed

echo ""
echo "✅ Postgres+Docker setup complete."
echo "   To stop the database: docker compose -f infra/docker-compose.yaml down"
echo "   To run the app: bun run dev"
