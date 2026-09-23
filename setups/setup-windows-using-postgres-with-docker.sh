#!/usr/bin/env bash
# Setup local (Windows, via Git Bash) usando Postgres via Docker Compose (infra/docker-compose.yaml).
# Requer Docker Desktop rodando. Uso: bash setups/setup-windows-using-postgres-with-docker.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Verificando Bun..."
if ! command -v bun >/dev/null 2>&1; then
	echo "Bun não encontrado. Instale rodando no PowerShell:"
	echo '  powershell -c "irm bun.sh/install.ps1 | iex"'
	echo "Depois abra um novo terminal Git Bash e execute este script novamente."
	exit 1
fi

echo "==> Verificando Docker..."
if ! command -v docker >/dev/null 2>&1; then
	echo "Docker não encontrado. Instale e abra o Docker Desktop antes de continuar: https://www.docker.com/products/docker-desktop/"
	exit 1
fi

echo "==> Instalando dependências (bun install)..."
bun install

if [ ! -f .env ]; then
	echo "==> Criando .env a partir de .env.example..."
	cp .env.example .env
fi

echo "==> Subindo Postgres (infra/docker-compose.yaml)..."
docker compose -f infra/docker-compose.yaml up -d

echo "==> Aguardando Postgres ficar saudável..."
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose -f infra/docker-compose.yaml ps -q perguntae_db)" 2>/dev/null)" = "healthy" ]; do
	sleep 1
done

echo "==> Gerando client Prisma e aplicando migrations..."
bun run prisma:generate
bun run prisma:migrate

echo "==> Populando banco com dados de seed..."
bun run prisma:db:seed

echo ""
echo "✅ Setup Postgres+Docker concluído."
echo "   Para parar o banco: docker compose -f infra/docker-compose.yaml down"
echo "   Para rodar o app: bun run dev"
