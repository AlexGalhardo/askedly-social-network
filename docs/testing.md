# Tests

## Runner

`bun:test` (native to Bun) for unit/functional/integration/smoke. [Playwright](https://playwright.dev) only for e2e.

## Types

| Type | What it covers | Where |
| --- | --- | --- |
| Unit/functional | pure functions (`lib/utils/*`, `lib/date-time.ts`, `lib/utils.ts`, payout calculation, profile sanitization, env validation in `lib/env.ts`, CSP) and the guard test that forbids `"use server"` in `lib/` | `*.test.ts` next to the file under test |
| Integration | repositories and services against a real test Postgres (not mocked): users, withdrawal (including concurrent withdrawal), question creation (webhook amount, daily limit), expiry, cron authorization, password change (current password mandatory, Google account setting the first one), signup validated on the server, feed with no private data and no author of an anonymous question | `tests/integration/*.test.ts` |
| Smoke | the application starts with `node .../next start` and responds (`/api/health` and `/`) | `tests/smoke/*.test.ts` |
| E2E | browser flows: home, login form, signup, password change asking for the current password, profile, account pages, CSP with no violation. The paid question flow through PIX/answering is not covered yet | `tests/e2e/*.spec.ts` (Playwright) |

## Running

```bash
bun run test            # unit + functional (lib/, hooks/, i18n/)
bun run test:unit
bun run test:integration  # needs DATABASE_URL pointing to a real, disposable Postgres
bun run test:smoke        # needs `bun run build` first (the test starts `next start` by itself)
bun run test:e2e          # playwright: locally it starts `next dev`; with CI=true it uses `next start` (run `bun run build` first)
```

Locally, run the e2e with `NEXTAUTH_URL=http://localhost:3200` (Playwright's port): the `signOut` of the password change redirects to `NEXTAUTH_URL`.

The captcha is optional: it is on only when both `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` and `CLOUDFLARE_TURNSTILE_SECRET` are set, and the server enforces it only in a production build. CI runs the e2e in `CI=true` mode (production) with the captcha on: run the build with Cloudflare's test keys in those two variables (see `deployment.md`); `tests/e2e/helpers.ts` waits for the token before submitting forms.

**Rule:** never run `test:integration`/`test:smoke` against the development database with real/seed data — always a disposable Postgres (`infra/docker-compose.yaml` or an ephemeral container) with the migrations applied from scratch.

Stripe credits are tested in `tests/integration/stripe-credits.test.ts` without calling Stripe: the transfer comes in as a parameter (`SendTransfer`). `i18n/config.test.ts` covers the choice of language, and Playwright runs with `locale: "pt-BR"` because the specs check Portuguese texts.

In CI (`.github/workflows/ci.yml` and `e2e.yml`) each type runs in a separate job with Postgres in a service container — see [`deployment.md`](deployment.md).
