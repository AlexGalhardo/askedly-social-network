---
name: askedly-local-verification
description: >
  How to validate a change in Askedly Social Network locally the same way CI validates it (lint, types, unit, integration,
  build, smoke, e2e in dev and in production mode). Use it before calling any task done, when a test passes
  locally and fails in CI, or when build/e2e fail because of the database, captcha, Bun vs Node, env validation or Prisma.
---

# Validate the way CI validates

## Disposable database

Never run integration/smoke/e2e against the database in `.env` (it is the dev database, with data). Start a disposable Postgres and
export the URL only for the command:

```bash
docker run -d --name askedly-ci-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=askedly_db -p 55432:5432 postgres:17-alpine
export DATABASE_URL="postgresql://postgres:postgres@localhost:55432/askedly_db"
bunx prisma migrate deploy
```

`next build` runs queries (static pages such as `/top-liked`), so it needs this `DATABASE_URL` too.

## Sequence (same order as CI)

```bash
bun run lint:ci            # also fails on warnings
bun run lint:md            # markdownlint
bunx tsc --noEmit
bun run test               # unit
bun run test:integration
bun run build && bun run test:smoke
bunx playwright test       # e2e against next dev
```

## E2E in production mode (what CI runs)

CI runs the e2e against `next start` with the captcha on. The captcha is optional (on only with both keys below); use
Cloudflare's test keys, which always pass, **at build time** (`NEXT_PUBLIC_*` is embedded at build time):

```bash
export NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
export CLOUDFLARE_TURNSTILE_SECRET=1x0000000000000000000000000000000AA
bun run build && CI=true bunx playwright test --retries=0
```

## Pitfalls already found

- **Run Next with Node, not Bun**: under the Bun runtime, `@prisma/client` and `pg`, externalized by Turbopack, do not
  resolve (`ResolveMessage: Cannot find module '@prisma/client-<hash>'`). Playwright and smoke already use `node`.
- **Prisma 7 does not regenerate the client on `migrate dev`**: run `bun run prisma:generate` after changing the schema, and
  replicate the change in `prisma/schema.sqlite.prisma`.
- **Generating the client with `DATABASE_URL=file:...`** switches the client to SQLite; regenerate with the Postgres URL afterwards.
- **Env validation breaks the build**: `lib/env.ts` runs from `next.config.ts` on every build and start. Without
  `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` the build fails with
  `Invalid environment variables`; missing optional features only print `[env] ...` warnings. `SKIP_ENV_VALIDATION=true`
  exists only for the Docker image build: do not use it to make a local build pass.
- **Rate limit in the e2e**: signup is limited per IP. Tests that sign up call `useUniqueClientIp(page)`
  (`tests/e2e/helpers.ts`) and wait for the captcha with `waitForCaptcha(page)`.
- **The first run of `next dev` is slow** (it compiles route by route); an isolated `waitForURL` timeout on the first
  run is not a bug, run again before investigating.
- **`NEXTAUTH_URL` on the test port**: Playwright starts Next on 3200. With the `NEXTAUTH_URL` from `.env` on another port, every `signOut` (password change, account deletion) redirects to a server that does not exist (`ERR_CONNECTION_REFUSED`). Run with `NEXTAUTH_URL=http://localhost:3200`.
- **The e2e specs check Portuguese texts**: Playwright runs with `locale: "pt-BR"` (`playwright.config.ts`). The routes
  are in English (`/login`, `/signup`, `/my-account`); the old Portuguese paths only exist as 301 redirects in `proxy.ts`.
- **The `pre-push` hook** runs unit + build: export the disposable `DATABASE_URL` when pushing.
