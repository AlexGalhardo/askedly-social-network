#!/usr/bin/env bash
# Build na Vercel (usado pelo script "vercel-build" do package.json, que a Vercel prefere ao "build").
set -euo pipefail

# O client do Prisma 7 é gerado em prisma/generated/, fora do git: sem isto o build não acha o módulo.
bunx prisma generate

# Migrations só no deploy de produção: preview e produção usam o mesmo DATABASE_URL, e um PR com migration nova
# não pode alterar o banco de produção só por ter gerado um preview.
if [ "${VERCEL_ENV:-}" = "production" ]; then
	bunx prisma migrate deploy
fi

bunx next build
