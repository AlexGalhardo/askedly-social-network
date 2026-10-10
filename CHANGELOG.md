# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and versioning follows [SemVer](https://semver.org/).

## [Unreleased]

### Security

- **Sessions revoked on password change/reset**: a JWT used to be valid for 30 days no matter what. Now `users.session_version` goes up on every change and every earlier token stops being valid, on all devices.
- **Strict nonce-based CSP** (`proxy.ts`, `lib/csp.ts`): scripts only with the nonce of the request. Every page is now rendered per request (required by the nonce).
- **Captcha verified on the server at signup** (before, only in the browser).
- **Withdrawal**: `POST /api/payments/withdraw` had no login and accepted `userId`, amount and PIX key from the body, which allowed withdrawing any user's balance to any key. The withdrawal now uses the session, computes the amount on the server, pays the user's own registered key and runs in a transaction that prevents withdrawing the same question twice. The route was removed.
- **Question creation**: the amount paid came from the body (paying R$ 2 and recording R$ 1,000 inflated withdrawal and refund) and so did the author. Now the amount is the one from the paid webhook, the author is the session user, and the daily limit is checked.
- **8 question/follow routes** (answer, delete, decline, report, like, unlike, expire, follow) did not check the session and trusted the `nickname` in the body. They now require login and use the session. Expiring a question also checks the deadline and the state on the server.
- **AbacatePay key exposed**: it was `NEXT_PUBLIC_*` and imported by a client component, so it went into the public bundle. It is now server-only (`ABACATEPAY_API_KEY`, `ABACATEPAY_WEBHOOK_SECRET`). **The production key must be rotated.**
- `simulate-payment` only responds in test mode; the webhook refuses everything if the secret is not configured; the public page `/pix-test` was removed.
- **Cron** (`/api/cronjob`, which deletes old accounts) was public. It now requires `CRON_SECRET`.
- Server Actions for payment data accepted any `nickname`, and the ones to accept/reject a follower accepted any request. They are now restricted to the session user.
- **Repositories exposed as public endpoints** (critical): `users`, `questions` and `webhooks-abacatepay.repository.ts` had `"use server"`, so anyone could call directly, with no login, `getAllUsers` (every user with password hash, email, PIX key and api_key), `updateUserPassword` (change the password of any account) and `createWebhookAbacatePay` (forge a payment). The directive was removed; the feed and signup now use their own Server Actions (`actions/feed-actions.ts`, `actions/signup-actions.ts`), and signup is now validated on the server. A test forbids `"use server"` in `lib/`.
- **Private user data going to the browser** (critical): feed, top liked, public profile (`getUserByNicknameAction`) and the NextAuth session serialized whole `User` rows (password hash, email, PIX key, api_key), including those of whoever asked and of followers. Now only public fields leave the server.
- **Author of an anonymous question revealed** in the feed, in top liked, on the profile and in the session of whoever received the question. Now `asked_by` comes as `null` and the page shows "Anonymous Question". Anonymous questions sent by someone no longer show up on that person's profile for other visitors.
- Feed: answers from private profiles were filtered only on the client (they reached the browser of any visitor). The filter is now on the server.
- **Resend key in the public bundle**: `app/api/send-contact-email/route.ts` had the key hardcoded as a fallback, and the contact page (client) imported that file to use the schema, carrying the key into the browser's JavaScript. The schema moved to `lib/schemas/contact.ts` and the key only comes from `RESEND_API_KEY`. **The old key must be rotated.**
- **Password change** (OWASP A07) did not ask for the current password, so anyone with an open session could take over the account. The current password is now mandatory; accounts created through Google (no password) set the first one on the same page. The unused duplicate route `app/api/user/update-password` was removed.
- Password hash with bcrypt cost 12 in every flow (signup and reset used 10).
- Transitive vulnerabilities fixed through `overrides` (`effect`, `baseline-browser-mapping`, `mysql2`). `bun audit`: 26 → 1, and that single one, `deepmerge-ts`, only exists in the Prisma CLI and is ignored with a justification. The audit job in CI now blocks.
- **OWASP Top 10:2025 audit** of the whole application, recorded in `docs/security.md`. Fixes:
  - `followUserAction` accepted the id of the follower: any user could make anyone follow anyone (and bypass the private-profile request).
  - Password reset sent the link to a fixed email of the owner (users never received it, and whoever read that inbox could take over any account), stored the token in plain text, let the token be used twice in a race and accepted any new password. The sender now comes from `RESEND_FROM_EMAIL`.
  - The per-email login rate limit counted every attempt before the captcha, which allowed locking the victim's login on purpose. It now counts only failures after the captcha, and a correct login resets it.
  - A nonexistent email answered in ~3 ms and a wrong password in ~260 ms: accounts could be enumerated. Both now cost one bcrypt.
  - Public profile, feed and ranking delivered to the browser answers from restricted profiles, private answers, pending questions, blocks and follow requests, internal fields (`webhook_id`, withdrawal, moderation) and the amount paid even when the owner hid it. The server now filters (`toPublicProfile`, `toPublicQuestion`).
  - Internal error messages (Prisma, network) no longer go to the client (`publicErrorMessage`).
  - Security headers (nosniff, Referrer-Policy, anti-clickjacking, Permissions-Policy, HSTS).
  - `simulate-payment` never runs on a production deployment, even with `NEXT_PUBLIC_TEST_MODE` turned on by mistake.
  - Telegram alert on the first rate limit violation of each window.
- **Rate limit** on login (per IP and per email), signup, contact, password reset request (per IP) and password change (per user). Fixed window in a `rate_limits` table in Postgres itself (one atomic upsert per request, shared by all serverless instances; no external service). The daily cron deletes expired windows.
- **Question report without checking the owner**: any logged-in user could "report" someone else's question, which also took it out of the answer queue. Now only the owner can.
- Captcha validation at login **failed open**: if Cloudflare did not respond, the login went through without captcha. It now fails closed (`lib/captcha.ts`, shared with contact).
- The contact form no longer logs the message body.
- Unused Server Actions (`likeAnswer`, `dislikeAnswer`, `withdrawUnanswered`) removed: every action is a public endpoint.

### Fixed

- **Theme color tokens generated no CSS**: Tailwind 4 ignored `tailwind.config.ts`, so `bg-background`, `bg-primary`, `border-input`, `prose` etc. did not exist (buttons and dialogs with no background, borders in the text color). The tokens moved to a `@theme` block in `app/globals.css`, the typography plugin came in through `@plugin`, and `tailwind.config.ts` was removed.
- Language selector unreadable in the dark theme (white background with white text).
- Border and shadow of the cards on `/login`, `/signup`, `/privacy-policy` and `/terms-of-use`.
- The redirects in `proxy.ts` never matched (the key had a slash, the lookup did not).
- The feed hid the user's own answers and questions: the "who blocked me" list contained the user's own nickname.
- The blocked users card had no name or avatar.
- The sidebar logged every received question to the console.
- **Deployment on Vercel**: every build failed (`Can't resolve './generated/prisma/client'`), because the Prisma 7 client lives outside git and nothing generated it. The `vercel-build` script (`infra/vercel-build.sh`) generates the client, applies migrations only in production and builds. First production deployment live at `https://respondeae.vercel.app`. The `deploy.yml` workflow was removed: the Vercel Git integration already deploys.
- Hydration error on the theme button: the markup depended on the theme, which only exists on the client. Both icons are rendered and the `dark:` CSS chooses; this also ended the flakiness of the signup e2e tests (React's re-render wiped fields that were already filled in).
- The signup nickname field now accepts digits and `_`, like the schema (which now requires lowercase, same as the field).
- Password change: with a wrong current password, the fields no longer disappear from the page (the form used `action`, which React resets).
- The root layout rendered every page twice (one tree per breakpoint): duplicated ids, doubled effects and API calls, hydration error.
- Forms with Zod 4 (signup, contact, account data) broke reading `ZodError.errors`; they now use `.issues`. A new signup redirects to the account page (it used to land on `/feed` because of a concurrent redirect).
- Password login and the contact form failed in production: the server read `CLOUDFLARE_TURNSTILE_SECRET_KEY` (nonexistent) and the client depended on `NEXT_PUBLIC_NODE_ENV` (never set).
- Toasts for profile, question, payment and ranking never showed up (they used a copy of the store that `<Toaster>` does not listen to).
- Routes disconnected the shared Prisma client at the end of every request.
- `biome.json` on the wrong schema broke the `pre-commit` hook.
- The seed runs on SQLite (`skipDuplicates` is only sent outside it).
- A single `<main>` landmark per page (13 pages had a `<main>` inside the layout's one).
- Email signup in production: the captcha did not show up on the first visit to the page, so every signup failed. A single `TurnstileWidget` now serves login, signup and contact.
- The "user without a password" message at login never showed up (the server threw an English text that the page did not recognize).

### Added

- **Environment variables validated with Zod at build time** (`lib/env.ts`): a missing essential one fails the build; a missing optional one only turns the feature off and warns.
- Translated error pages (`app/error.tsx`, `app/global-error.tsx`) instead of the server's 500 error; the cron answers a handled error and logs it on Telegram.
- **Internationalization** with next-intl: English (default), Portuguese and Spanish. The language comes from the `NEXT_LOCALE` cookie (selector in the sidebar) or from the browser; there is no language in the URL. Only the interface is translated, not user content. The keys are checked by `tsc` in the three languages.
- **Admin panel** at `/admin` (404 for anyone who is not an admin): totals per currency, platform revenue, credit purchases and withdrawals.
- **Demo mode in Docker** (`infra/docker-compose.demo.yaml`): Postgres, migrations, seed and app, with payments simulated by `PAYMENTS_SIMULATED` (ignored in production on Vercel). The seed gained payment data for the admin (`admin@gmail.com`).
- `infra/stripe-setup.ts`: creates or updates the Stripe webhook idempotently.
- Open source files: `LICENSE.md`, `SECURITY.md`, `CONTRIBUTE.md`.
- markdownlint (`bun run lint:md`), in CI and in lint-staged.
- Documentation: `docs/payments-stripe.md`, `stripe-setup.md`, `vercel-deploy.md`, `docker.md`, `i18n.md`, `tooling.md`.
- Documentation of the Neon Postgres provisioning and seed (`docs/database.md`, `docs/vercel-deploy.md`) and of the real Stripe sandbox flow through the Vercel Marketplace (`docs/stripe-setup.md`).
- **Payment with credits through Stripe**, alongside PIX. The user buys US dollar credits (Stripe Checkout, `POST /api/stripe/checkout`) and pays for questions with them (`POST /api/question/create-with-credits`). The webhook `/api/webhook/stripe` credits the purchase idempotently.
- **Stripe Connect (Accounts v2, recipient account)**: whoever receives questions signs up with Stripe in My Account. On answering a question paid with credits, the amount minus the platform fee is transferred to the connected account; a declined, expired or reported question returns the full credits to whoever asked. The daily cron retries pending settlements.
- `questions.currency` (`BRL` for PIX, `USD` for credits), `questions.stripe_transfer_id`, `users.credits_cents`, `users.stripe_account_id` and the `stripe_purchases` table. `questions.webhook_id` became optional.

- CI/CD with GitHub Actions: `ci.yml` (lint, format, typecheck, `bun audit`, unit, integration, build + smoke, all blocking), `e2e.yml` (Playwright) and `deploy.yml` (Vercel, only after green CI on `main`). See `docs/deployment.md`.
- `lib/session.ts` (`getSessionUser`) and tested services for rules that move money: `withdraw.service`, `question-create.service`, `question-expiry.service`.
- Integration tests for withdrawal (including concurrency), question creation, expiry and cron authorization. Regression e2e test for the single render of the layout. The signup e2e, previously `fixme`, now passes.
- `.editorconfig` at the root (tab, width 4, LF; YAML and `package.json` with spaces) and `.gitattributes` pinning LF.
- Agent skills vendored in `.claude/skills/` (impeccable, ponytail, addyosmani/agent-skills, graphify, frontend-design), with agents in `.claude/agents/` and checklists in `.claude/references/`; origin and commits in `.claude/skills/SOURCES.md`. `.graphifyignore` for the knowledge graph.
- Final phase in `PLAN.md`: security audit of the whole application against the OWASP Top Ten.
- Unit tests (`lib/`), integration (`tests/integration/`), smoke (`tests/smoke/`) and e2e with Playwright (`tests/e2e/`).
- `AGENTS.md`/`CLAUDE.md` at the root and documentation in `docs/` focused on giving context to AI agents.
- `setups/` folder with local setup scripts (Windows/Unix × SQLite/Postgres/Postgres+Docker) and `infra/` with Docker/docker-compose.
- Conventional Commits mandatory through commitlint in the `commit-msg` hook.
- "Report answer" works: whoever asked can report the answer received (once, only after it is answered).

### Changed

- **All Markdown in English**: `README.md`, `PLAN.md`, `CHANGELOG.md`, `AGENTS.md`/`CLAUDE.md`, `docs/` and the project skills were translated from Portuguese and brought up to date (English routes, Base UI, optional captcha, env validation, current Vercel domain). Code, comments, docs and commit messages are in English; the interface stays translated (en, pt, es) and user content is never translated.
- **Production domain** is now `https://askedly-social-network.vercel.app` (the old `respondeae.vercel.app` is still attached). The Vercel project is still named `respondeae`. After the GitHub repository was renamed, pushes to `main` stopped triggering deployments: production is deployed with `vercel deploy --prod` until the Git integration is reconnected.
- **Base UI instead of shadcn/ui + Radix**: `components/ui/*` now uses `@base-ui/react` 1.9.0. `asChild` became `render` (`<Button render={<Link href="/" />}>`), the `data-[state=...]` selectors became `data-[checked]`/`data-[active]`, and `@radix-ui/*`, `tailwindcss-animate` and `components.json` were removed.
- **Routes in English** (`/login`, `/signup`, `/my-account`, `/payments`, `/terms-of-use` etc.). The old Portuguese ones redirect with a 301. Nicknames equal to a route are now rejected at signup.
- The site title is just **Askedly**, with its own icon (a question bubble) in the sidebar and as the favicon.
- **Optional captcha**: Turnstile is only on with the site key and the secret configured; without them the widget disappears and the server does not require a token.
- `CONTRIBUTING.md` became `CONTRIBUTE.md`. `next.config.mjs` became `next.config.ts`.
- **The project is now called Askedly Social Network** (repository `askedly-social-network`). The Vercel project and the official seed account keep the old names.
- `PLAN.md` rewritten in four phases: STRUCTURE, ALPHA, BETA and 1.0.0 STABLE.
- `LICENSE` became `LICENSE.md`.
- Dependencies updated to the latest stable versions, with pinned versions: Next 16.4.0, TypeScript 7.0.2, Radix UI, React Query 5.104.1, Resend 6.32.1, lucide-react 1.55.0, Biome 2.5.15, Playwright 1.64.0, among others. Prisma stays at 7.10.0 (8 is still a release candidate).
- The NextAuth session carries only the user's own account. Questions, followers and blocks are fetched per page (`actions/my-account-actions.ts`); the sidebar counter became a `COUNT` in the database.
- **Prisma 6 → 7.10.0** with driver adapters (`@prisma/adapter-pg`; `@prisma/adapter-libsql` for local SQLite), `prisma.config.ts`, client generated in `prisma/generated/` and a single shared instance. Run `bun run prisma:generate` after installing. `SQLITE_DATABASE_URL` no longer exists: use `DATABASE_URL="file:./dev.db"`.
- `@react-email/components` 0.0.41 → 1.0.12.
- `typescript.ignoreBuildErrors` removed: the build checks types again (0 errors). Lint with 0 errors across the whole codebase (before, only `app/` was checked).
- Server Actions use `updateTag` (Next 16) instead of `revalidateTag` with one argument.
- Biome reads `.editorconfig` and also formats `tests/` and the root configs.
- `TODO.md` renamed to `PLAN.md`.
- Bun 1.4.2 as the official package manager; dependencies pinned to exact versions.
- The NextAuth session no longer writes `last_login_at` or reactivates the account on every read (only at sign-in), and related users come with public fields only.
- All Biome warnings fixed; `lint:ci` fails on warnings.

### Removed

- `framer-motion` (it spun an icon that was already spinning with `animate-spin`, doubling the spinner speed).
- `@prisma/extension-accelerate` (no effect with a plain Postgres `DATABASE_URL`).
- 30 shadcn components and 28 dependencies with no import at all; the `vercel` CLI as a devDependency (called pinned in the workflow); dead code (`actions/question-actions.ts`, `lib/create-pix-payment.ts`, the unused `lib/rate-limiter.ts`, the empty `report-answer` route).
- "Withdraw unanswered questions": it had no page, and the route it called never existed.
- Like/unlike state and handlers in "Sent questions", which were never rendered.

## [1.0.0] - 2026-09-23

First version with formal versioning. Starting point of this changelog's history — the earlier commit history did not follow Conventional Commits.
