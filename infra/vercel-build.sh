#!/usr/bin/env bash
# Build on Vercel (used by the "vercel-build" script in package.json, which Vercel prefers over "build").
set -euo pipefail

# The Prisma 7 client is generated in prisma/generated/, outside git: without this the build cannot find the module.
bunx prisma generate

# Migrations only on the production deploy: preview and production use the same DATABASE_URL, and a PR with a new migration
# must not change the production database just because it generated a preview.
if [ "${VERCEL_ENV:-}" = "production" ]; then
	bunx prisma migrate deploy
fi

bunx next build
