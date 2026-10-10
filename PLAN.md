# PLAN — Askedly Social Network

> Living plan. Every session must read this file before continuing.
> Legend: `[ ]` not started · `[~]` partial or depends on an action by the owner of the credentials · `[x]` done.
> Rule: 1 finished task = 1 commit (Conventional Commits), with test and docs where they apply.

A global social network of paid questions and answers. Everyone has a public profile; whoever asks pays (PIX in Brazilian reais or US dollar credits through Stripe), whoever answers gets most of it, and the platform keeps the fee.

The project is built in four phases. A phase only starts once the exit criterion of the previous one is met.

| Phase | Version | Goal |
| --- | --- | --- |
| 1. STRUCTURE | `0.x` | Repository, tooling, database and CI ready, with no product feature |
| 2. ALPHA | `0.x` | Product working end to end for the team, with simulated payments |
| 3. BETA | `0.x` | Real payments, audited security, three languages, production for invited users |
| 4. 1.0.0 STABLE | `1.0.0` | Open to the public, open source, operable by anyone with the documentation |

Releases are `0.x` until the Phase 4 exit criterion is met; `1.0.0` is cut then. Every commit on `main` is a release: SemVer bump in `package.json`, a section in `CHANGELOG.md`, a `vX.Y.Z` tag and a GitHub release (see `CONTRIBUTE.md`).

## Locked decisions (do not ask again)

- **Stack:** Next.js 16 (App Router) + React 19 + strict TypeScript, Prisma 7 + PostgreSQL, NextAuth, Tailwind 4 (CSS-first, tokens in `app/globals.css`) + Base UI (`@base-ui/react`), TanStack Query.
- **Package manager:** Bun (packages, scripts, tests). Next runs on Node in production, smoke and e2e (Vercel runs Node).
- **Dependencies:** latest stable version, exact version, no `rc`/`beta`. A new dependency needs a justification.
- **Database:** `prisma/schema.prisma` (Postgres) is the production schema, with versioned migrations. `prisma/schema.sqlite.prisma` is a mirror maintained by hand, only for local dev without Docker.
- **Payments:** two independent rails. PIX (AbacatePay) in BRL with manual withdrawal; credits (Stripe) in USD with automatic payout through Connect. `questions.currency` separates the two. Amounts are always integer cents, computed on the server.
- **Platform fee:** the answerer keeps 50% of questions up to 5.00 and 70% above that (`calculatePayout`), on both rails.
- **Languages:** English (default), Portuguese and Spanish, with no prefix in the URL. Only the interface is translated; user content is not. Code, comments, documentation and commit messages are in English.
- **Brand:** "Askedly" in the interface; "Askedly Social Network" is the repository and project name.
- **Security:** every endpoint is public; the acting user comes from the session; no whole `User` row goes to the browser; a secret is never `NEXT_PUBLIC_*`.
- **Tests:** `bun:test` for unit, integration (real, disposable Postgres, no mocks) and smoke; Playwright for e2e.
- **Deployment:** Vercel through the Git integration (`main` = production, PR = preview). CI on GitHub Actions blocks on lint, types, audit, tests and build.
- **Formatting:** `.editorconfig` (tab, width 4, LF) is the source of truth; Biome for code, markdownlint for Markdown.
- **Skills:** every task uses the skills in `.claude/skills/` (list in `CLAUDE.md`).

---

## Phase 1 — STRUCTURE

Goal: anyone clones, runs one command and has the environment up, with CI green, before any product exists.

### Repository and tooling

- [x] Repository `askedly-social-network`, MIT license (`LICENSE.md`), `.editorconfig`, `.gitignore`, `.dockerignore`
- [x] Bun pinned in `packageManager`/`engines`; every dependency at an exact version
- [x] Strict TypeScript, no `ignoreBuildErrors`
- [x] Biome (lint + format) reading `.editorconfig`; `lint:ci` fails on warnings
- [x] markdownlint (`bun run lint:md`) on `*.md`, `docs/` and `.github/`
- [x] Husky: `pre-commit` (format + lint-staged), `commit-msg` (commitlint), `pre-push` (tests + build)
- [x] Conventional Commits + SemVer + `CHANGELOG.md` (Keep a Changelog)

### Base application

- [x] Next.js App Router with layout, light/dark theme and side navigation
- [x] Defined layers: `app/` (routes), `actions/` (Server Actions), `lib/services` (business rules), `lib/repositories`, `hooks/`
- [x] Security headers and strict nonce-based CSP (`proxy.ts`, `lib/csp.ts`)
- [x] `/api/health`
- [x] Environment variables validated with Zod at build time (`lib/env.ts`): a missing essential one fails the build, an optional one only warns
- [x] Error pages (`app/error.tsx`, `app/global-error.tsx`) instead of the raw 500

### Database

- [x] Prisma 7 with driver adapters and a single instance (`prisma/prisma-client.ts`)
- [x] Initial schema and versioned migrations; SQLite mirror for local dev
- [x] Modular seed (`prisma/seed-orchestrator.ts`): system users, random users, followers, questions

### Local environment and infrastructure

- [x] `.env.example` with every variable commented
- [x] Six scripts in `setups/` (Windows/Unix × SQLite/Postgres/Postgres with Docker)
- [x] `infra/docker-compose.yaml` (Postgres) and `infra/Dockerfile` (`oven/bun` image with a pinned tag)

### CI/CD

- [x] `ci.yml`: lint, markdown lint, typecheck, dependency audit, unit tests, integration (Postgres in a service container), build + smoke
- [x] `e2e.yml`: Playwright against a production build
- [x] Dependabot for `bun` and `github-actions`
- [~] Vercel Git integration; `infra/vercel-build.sh` (generate, migrate only in production, build). After the GitHub repository was renamed, pushes to `main` stopped triggering deployments: production is deployed with `vercel deploy --prod` until the integration is reconnected (Settings > Git)

### Documentation for people and agents

- [x] `README.md`, `AGENTS.md` and `CLAUDE.md` (identical, short, pointing to `docs/`)
- [x] `docs/architecture.md`, `docs/database.md`, `docs/tooling.md`, `docs/testing.md`, `docs/deployment.md`
- [x] Skills vendored in `.claude/skills/` with their origin recorded in `SOURCES.md`

**Exit criterion:** a clean clone + one script from `setups/` + `bun run dev` works; CI green on an empty PR.

---

## Phase 2 — ALPHA

Goal: the whole product works for the team, from creating an account to withdrawing, with simulated payments. Rough visual edges are fine; a broken flow is not.

### Accounts

- [x] Signup with email and password, validated on the server (Zod), with captcha
- [x] Login with credentials and with Google (NextAuth, JWT session)
- [x] Forgot password and reset by email (Resend + React Email)
- [x] My Account: personal data, social networks, avatar (UploadThing), password, delete account
- [x] Privacy settings (private profile, accept anonymous questions, show amounts, likes)

### Profile and network

- [x] Public profile at `/[slug]`
- [x] Follow, unfollow, requests for private profiles, accept and reject
- [x] Block and unblock
- [x] Followers and following lists

### Questions

- [x] Send a paid question: public or anonymous, public or private answer, public or private amount
- [x] Daily question limit (10 public, 1 anonymous), reset by the cron
- [x] Answer, decline, expire by deadline, report a question, report an answer
- [x] Received questions and sent questions
- [x] Like and unlike answers
- [x] Community feed and a feed of the people you follow; ranking of the most liked

### Money (simulated)

- [x] PIX charge with QR code and confirmation by polling
- [x] Balance derived from the answered questions; platform fee by `calculatePayout`
- [x] Withdrawal to the registered PIX key, in a transaction, without withdrawing the same question twice
- [x] Demo mode `PAYMENTS_SIMULATED` (`lib/payment-simulation.ts`)
- [x] Full application in Docker with seed (`infra/docker-compose.demo.yaml`, `docs/docker.md`)

### Administration

- [x] Admin account in the seed (`admin@gmail.com`) and `/admin` panel with totals per currency, revenue, purchases and withdrawals
- [x] Seed of demo payments for the panel (`seed-payments-demo.service.ts`)
- [x] Daily cron protected by `CRON_SECRET`: limits, deleted accounts, expired rate limits

### Tests of the phase

- [x] Unit tests of the pure functions (payout, question privacy, dates, utilities)
- [x] Integration: question creation, withdrawal (including concurrent), expiry, report, feed, signup, password
- [x] Smoke: the build starts and responds

**Exit criterion:** the walkthrough in `docs/docker.md` passes in full, from signup to withdrawal, with no external account.

---

## Phase 3 — BETA

Goal: real money with invited users. Nothing that moves money or exposes data may depend on trusting the client.

### Real payments

- [x] PIX through AbacatePay v2 with a signed webhook (HMAC over the raw body) that is idempotent
- [x] US dollar credits through Stripe: hosted Checkout, signed webhook, idempotent crediting (`docs/payments-stripe.md`)
- [x] Question paid with credits: debit conditional on the balance in the same transaction
- [x] Stripe Connect (Accounts v2, recipient account): hosted onboarding and payout by transfer on answering
- [x] Full refund of the credits when a question is declined, expired or reported
- [x] Cron retries pending settlements and expires overdue credit questions
- [x] Idempotent Stripe setup script (`infra/stripe-setup.ts`, `docs/stripe-setup.md`)
- [ ] Handle refund and dispute of a credit purchase (`charge.refunded`, `charge.dispute.created`)
- [ ] Automatic PIX payout (today the withdrawal only records the request; the payment is manual)
- [ ] History of credit purchases and Stripe payouts on the Payments page

### Security

- [x] OWASP Top 10:2025 audit (`docs/security.md`), with findings fixed and accepted risks recorded
- [x] Identity always from the session (`getSessionUser`); per-object authorization inside the `where` itself
- [x] No whole `User` row in the browser; the author of an anonymous question never leaves the server
- [x] Rate limit in Postgres for login, signup, contact, password and credit purchase
- [x] Captcha (Turnstile) as an optional feature: on only with both keys, and then it fails closed
- [x] Captcha verified on the server; sessions revoked on password change (`session_version`)
- [x] Guard test: `"use server"` forbidden in `lib/`
- [x] `SECURITY.md` with a private reporting channel
- [x] Guard against asking yourself a question with credits
- [ ] Anti-fraud limits on credit purchases (daily cap per account, blocking freshly created accounts)

### Internationalization

- [x] next-intl with English (default), Portuguese and Spanish; language by cookie or browser (`docs/i18n.md`)
- [x] Translation keys checked by `tsc` in the three languages
- [x] Interface, API errors, metadata, legal texts and emails translated
- [x] Money formatted by the currency of the data (`BRL` or `USD`), dates by the language
- [ ] Review of the legal texts in English and Spanish by a fluent person (today they are a translation from Portuguese)
- [ ] E2E in English (today Playwright runs only in `pt-BR`)

### Quality and operations

- [x] Credits integration tests: repeated webhook, concurrent spending, refund and payout exactly once
- [x] E2E: home, login, signup, password change, CSP with no violation in production mode
- [ ] E2E of the paid question flow (PIX and credits) in demo mode
- [x] Logs of business events and errors on Telegram
- [~] Production on Vercel validated (`/api/health`, migrations, headers, webhooks and cron refusing without a secret)

### Actions only the owner of the credentials can take

- [ ] Rotate the keys of the legacy repository `askedly.com` (its `.env.example` had values that looked real: Stripe, database, Telegram token)
- [ ] Rotate the AbacatePay key and register the production webhook
- [x] Create `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` on Vercel and enable Connect (`docs/stripe-setup.md`): done for the `askedly-stripe` sandbox (keys set, webhook created, sandbox claimed, Connect enabled and verified by creating a recipient account and an onboarding link). Live keys are a Phase 4 item
- [ ] Create `CRON_SECRET` and `RESEND_FROM_EMAIL` on Vercel
- [ ] Check `NEXT_PUBLIC_TEST_MODE=false` in production and remove `NODE_ENV`, `SEED_*`, `DANGER_MODE`
- [ ] Enable Deployment Checks on Vercel requiring `CI` and `E2E`
- [ ] Reconnect the Vercel Git integration to the renamed repository (Settings > Git), so that pushes to `main` deploy again

**Exit criterion:** one real paid question on each rail, answered and paid out in production; no open security item with high severity.

---

## Phase 4 — 1.0.0 STABLE (`1.0.0`)

Goal: open to the public and maintained as an open source project. Someone arriving for the first time can run, understand, contribute and do their own deployment with the repository alone.

### Open source

- [x] `LICENSE.md` (MIT), `CONTRIBUTE.md`, `SECURITY.md`
- [x] `README.md` with what it is, stack, how to run and a map of the documentation
- [ ] `CODE_OF_CONDUCT.md`
- [ ] Issue and pull request templates in `.github/`
- [x] README and main documentation in English

### Complete documentation

- [x] `docs/architecture.md`, `database.md`, `auth.md`, `security.md`, `testing.md`, `tooling.md`
- [x] `docs/payments-pix.md`, `payments-stripe.md`, `stripe-setup.md`
- [x] `docs/i18n.md`, `email.md`, `uploads.md`, `telegram-bot.md`
- [x] `docs/deployment.md`, `vercel-deploy.md` (manual and with AI agents), `docker.md`
- [ ] ADRs for the big decisions (two payment rails, language without a prefix, derived balance instead of a ledger)

### Product

- [ ] Own domain, with `metadataBase`, sitemap and emails pointing to it (today `metadataBase` is `respondeae.com.br` and production answers at `askedly-social-network.vercel.app`, with `respondeae.vercel.app` still attached)
- [x] Route names in English with a 301 redirect from the old ones (`proxy.ts`) and nicknames reserved for the routes
- [ ] Product decision: should a public profile show answers to any visitor? (the flag `privacy_show_questions_answered_only_to_followers` does not change the page today)
- [ ] Notifications (question received, answer received, payout made)
- [ ] Accessibility reviewed (WCAG AA) and Core Web Vitals measured in production

### Reliability

- [ ] Ledger of movements (purchases, debits, refunds, payouts) instead of derived balances, with reconciliation against Stripe
- [ ] Monitoring and alerts (errors, webhook failure, settlement pending for more than 24 h)
- [ ] Database backup and restore test
- [ ] Load test of the feed and of question creation
- [ ] Rollback plan documented and rehearsed

### Launch

- [ ] Stripe live keys and Stripe's go-live checklist completed
- [ ] Terms of use and privacy policy reviewed by a lawyer (LGPD, GDPR)
- [ ] Tag `v1.0.0`, GitHub release with notes from `CHANGELOG.md`

**Exit criterion:** an outsider does their own deployment following the documentation alone, and the project spends 30 days in production with no payment incident.
