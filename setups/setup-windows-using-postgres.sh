#!/usr/bin/env bash
# Setup local (Windows, via Git Bash) usando um Postgres já instalado/rodando na máquina (sem Docker).
# Uso: bash setups/setup-windows-using-postgres.sh
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

echo "==> Instalando dependências (bun install)..."
bun install

if [ ! -f .env ]; then
	echo "==> Criando .env a partir de .env.example..."
	cp .env.example .env
	echo "Edite o .env com a DATABASE_URL do seu Postgres local antes de continuar, se necessário."
fi

DB_URL="$(grep '^DATABASE_URL=' .env | cut -d= -f2- | tr -d '"')"
echo "==> Usando DATABASE_URL=${DB_URL}"

echo "==> Verificando conexão com o Postgres..."
if ! command -v psql >/dev/null 2>&1; then
	echo "Aviso: 'psql' não encontrado no PATH (normal em instalações Windows sem o pacote de linha de comando)."
	echo "Pulando checagem de conexão -- garanta que o Postgres (ex: PostgreSQL instalado via instalador oficial) está acessível."
else
	psql "$DB_URL" -c '\q' 2>/dev/null || {
		echo "Não foi possível conectar em ${DB_URL}."
		echo "Confirme que o serviço do Postgres está rodando (services.msc) e que o banco existe."
		exit 1
	}
fi

echo "==> Gerando client Prisma e aplicando migrations..."
bun run prisma:generate
bun run prisma:migrate

echo "==> Populando banco com dados de seed..."
bun run prisma:db:seed

echo ""
echo "✅ Setup Postgres (local) concluído."
echo "   Para rodar o app: bun run dev"
