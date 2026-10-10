# Askedly Social Network — AI Agent Guide

Global Q&A social network (Retrospectiva/NGL style) with paid questions, either by PIX (BRL) or with credits bought on Stripe (USD), with payouts through Stripe Connect.
Next.js 16 (App Router) + React 19 + Prisma 7/PostgreSQL + NextAuth + next-intl (en, pt, es) + AbacatePay + Stripe + Resend + UploadThing.

## Essential commands

- Package manager: **Bun 1.4.2** (`packageManager` in `package.json`). Use `npm`/`node` only when Bun does not support something.
- `bun install` — install dependencies
- `bun run dev` — development server (Turbopack)
- `bun run build` / `bun run start` — production build and server
- `bun run lint` / `bun run format` — Biome (lint and format); `bun run lint:md` — markdownlint
- `bun run prisma:migrate` / `bun run prisma:studio` / `bun run prisma:db:seed` — database

## Local setup

See `setups/` for the 6 ready-made scripts (Windows/Unix × SQLite/Postgres/Postgres+Docker).
Infra (Docker/docker-compose) lives in `infra/`. Full application with simulated payments and seed: `docker compose -f infra/docker-compose.demo.yaml up --build` (admin: `admin@gmail.com` / `adminBR@123`, panel at `/admin`).

## Structure

- `app/` — App Router routes (pages in English: `login`, `signup`, `feed`, `my-account`, `payments`, `[slug]` = public profile; the old Portuguese paths 301-redirect in `proxy.ts`), `app/api/*/route.ts` (API routes) and the error pages `app/error.tsx` and `app/global-error.tsx`
- `actions/` — Server Actions
- `components/` — shared components; `components/ui/` holds the Base UI wrappers
- `lib/` — auth, PIX and Stripe integrations, repositories, services, utils, env validation (`lib/env.ts`)
- `i18n/` and `messages/` — next-intl configuration and the texts per language (`en` is the source of truth)
- `hooks/` — React Query hooks per domain
- `prisma/` — schema, migrations, seed
- `emails/` — React Email templates

## Detailed documentation (`docs/`)

- [`docs/architecture.md`](docs/architecture.md) — layers and data flow
- [`docs/database.md`](docs/database.md) — Prisma schema, SQLite strategy for dev, Neon provisioning and seed
- [`docs/auth.md`](docs/auth.md) — NextAuth and sessions
- [`docs/payments-pix.md`](docs/payments-pix.md) — AbacatePay and the PIX webhook
- [`docs/payments-stripe.md`](docs/payments-stripe.md) — credits, Stripe webhook and payouts through Connect
- [`docs/stripe-setup.md`](docs/stripe-setup.md) — setting up Stripe (manually and with AI agents)
- [`docs/i18n.md`](docs/i18n.md) — languages, where the texts live, how to translate
- [`docs/email.md`](docs/email.md) — Resend and templates
- [`docs/uploads.md`](docs/uploads.md) — UploadThing
- [`docs/telegram-bot.md`](docs/telegram-bot.md) — Telegram logger/bot
- [`docs/testing.md`](docs/testing.md) — how to run each kind of test
- [`docs/deployment.md`](docs/deployment.md) — CI/CD and deployment
- [`docs/vercel-deploy.md`](docs/vercel-deploy.md) — Vercel deployment walkthrough (manually and with AI agents)
- [`docs/docker.md`](docs/docker.md) — full application in Docker with simulated payments and seed
- [`docs/tooling.md`](docs/tooling.md) — tools, git hooks and how to validate like CI
- [`docs/security.md`](docs/security.md) — OWASP Top 10:2025 audit, accepted risks

## Skills (mandatory)

Third-party skills are vendored in `.claude/skills/` (origin/commit in `.claude/skills/SOURCES.md`), plus agents in `.claude/agents/` and checklists in `.claude/references/`. **Every session/agent must use them in the refactoring** (plan in `PLAN.md`):

- Before any task: `using-agent-skills` to pick the skill; `graphify` to map the code (CLI `graphifyy==0.9.68`) instead of blind grep
- Code: `ponytail` (minimal solution, YAGNI), `code-simplification`, `incremental-implementation`, `test-driven-development`, `debugging-and-error-recovery`
- Review: `code-review-and-quality`, `ponytail-review`/`ponytail-audit`, `security-and-hardening` (OWASP), `performance-optimization`
- UI: `impeccable`, `frontend-design`, `frontend-ui-engineering`, `ui-ux-pro-max`, `web-design-guidelines`, `vercel-react-best-practices`
- Process: `git-workflow-and-versioning`, `ci-cd-and-automation`, `documentation-and-adrs`, `planning-and-task-breakdown`
- Project-specific: `askedly-secure-endpoint` (every action/route/piece of data that reaches the browser) and `askedly-local-verification` (validate like CI before calling something done)

## Conventions

- Formatting: `.editorconfig` (tab, width 4, LF) is the source of truth; Biome reads it through `formatter.useEditorconfig`. YAML and `package.json` use spaces
- Conventional Commits are mandatory (validated by commitlint in `commit-msg`)
- Language: code, comments, docs and commit messages are in English. The UI is translated (en default, pt, es) through next-intl; user content is never translated
- Comments only for edge cases/non-obvious decisions — never a redundant comment
- Strongly typed TypeScript; avoid unjustified `any`
- UI text is never hardcoded: a key in `messages/en`, `pt` and `es` (`tsc` fails if one is missing). Details in [`docs/i18n.md`](docs/i18n.md)
- UI library: Base UI (`@base-ui/react`), not shadcn/Radix. Wrappers live in `components/ui/`; composition uses the `render` prop instead of `asChild` (`<Button render={<Link href="/" />}>`); state selectors are `data-[checked]`/`data-[active]`/`data-[open]`. Tailwind 4 is CSS-first: design tokens live in the `@theme inline` block of `app/globals.css`; there is no `tailwind.config.ts` and no `components.json`
- Brand: the name shown in the UI is "Askedly" (logo in `components/askedly-logo.tsx`, favicon in `app/icon.svg`); the repository/project name stays "Askedly Social Network"
- Environment: `lib/env.ts` (Zod) is called from `next.config.ts`. A missing essential variable fails the build, a missing optional one only turns the feature off and warns; `SKIP_ENV_VALIDATION=true` exists only for the Docker image build. Captcha (Cloudflare Turnstile) is optional: on only when both `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` and `CLOUDFLARE_TURNSTILE_SECRET` are set
- Routes: a nickname equal to a route is rejected at signup (`RESERVED_NICKNAMES` in `lib/schemas/signup.ts`); add new top-level routes to that list
- Security: the acting user comes from `getSessionUser()` (`lib/session.ts`), never from the body; `"use server"` only in `actions/` (in `lib/` it becomes a public endpoint); no whole `User` row goes to the browser; money values are computed on the server; a secret is never `NEXT_PUBLIC_*`. Details in [`docs/architecture.md`](docs/architecture.md)
- Prisma 7: run `bun run prisma:generate` after `bun install`; use only the instance from `@/prisma/prisma-client`
- Before calling something done: `bun run lint:ci`, `bun run lint:md`, `bunx tsc --noEmit`, `bun run build` and the relevant tests must pass (CI blocks on all of them)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
