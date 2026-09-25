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

echo "==> Apontando DATABASE_URL para SQLite (file:./dev.db)..."
sed -i.bak '/^DATABASE_URL=/d' .env && rm -f .env.bak
echo 'DATABASE_URL="file:./dev.db"' >>.env

echo "==> Gerando client e sincronizando schema SQLite (prisma/schema.sqlite.prisma)..."
# prisma.config.ts seleciona schema.sqlite.prisma porque DATABASE_URL começa com `file:`.
bunx prisma generate
bunx prisma db push

echo "==> Populando banco com dados de seed..."
bunx prisma db seed || {
	echo "Aviso: o seed usa createMany({ skipDuplicates }), que o SQLite não suporta (ver PLAN.md, Fase 11)."
	echo "O banco foi criado vazio; cadastre usuários pela aplicação."
}

echo ""
echo "✅ Setup SQLite concluído. Banco em: ./dev.db"
echo "   Lembrete: prisma/schema.sqlite.prisma é um espelho manual de prisma/schema.prisma (ver docs/database.md)."
echo "   Para rodar o app: bun run dev"
