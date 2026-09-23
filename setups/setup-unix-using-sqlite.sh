#!/usr/bin/env bash
# Setup local (Linux/macOS) usando SQLite -- sem Postgres, sem Docker.
# Uso: bash setups/setup-unix-using-sqlite.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Verificando Bun..."
if ! command -v bun >/dev/null 2>&1; then
	echo "Bun não encontrado. Instalando (curl -fsSL https://bun.sh/install | bash)..."
	curl -fsSL https://bun.sh/install | bash
	echo "Abra um novo terminal (ou rode 'source ~/.bashrc') e execute este script novamente."
	exit 1
fi

echo "==> Instalando dependências (bun install)..."
bun install

if [ ! -f .env ]; then
	echo "==> Criando .env a partir de .env.example..."
	cp .env.example .env
fi

if ! grep -q '^SQLITE_DATABASE_URL=' .env; then
	echo 'SQLITE_DATABASE_URL="file:./dev.db"' >>.env
fi

echo "==> Gerando client e sincronizando schema SQLite (prisma/schema.sqlite.prisma)..."
bunx prisma generate --schema=prisma/schema.sqlite.prisma
bunx prisma db push --schema=prisma/schema.sqlite.prisma --skip-generate

echo "==> Populando banco com dados de seed..."
bun prisma/seed.ts || {
	echo "Aviso: prisma/seed.ts foi escrito pensando no client gerado a partir do schema.prisma (Postgres)."
	echo "Se falhar aqui, rode o seed manualmente após confirmar que o client SQLite está ativo."
}

echo ""
echo "✅ Setup SQLite concluído. Banco em: ./dev.db"
echo "   Lembrete: prisma/schema.sqlite.prisma é um espelho manual de prisma/schema.prisma (ver docs/database.md)."
echo "   Para rodar o app: bun run dev"
