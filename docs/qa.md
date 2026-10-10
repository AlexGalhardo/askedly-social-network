# Autonomous QA (`qa.ts`)

`qa.ts` at the repo root is a self-driving QA engineer. It walks the running app like a careful human
tester: every public page, link, locale, auth flow, API route authorization, injection/XSS attempt, and the
full PIX and Stripe (credits) payment rails end to end. It creates its own users through the real signup UI
(unique per run) and depends on no seed data other than the admin. It replaces the old
`tests/e2e/demo-check.mjs`.

## How to run

Bring up the demo stack (simulated payments, seeded admin) and point the script at it:

```bash
APP_PORT=3300 docker compose -f infra/docker-compose.demo.yaml up --build -d
bun run qa http://localhost:3300 --report=qa-report.json
# or: bun qa.ts http://localhost:3300
```

Flags:

- `--allow-remote` — allow a non-local `baseUrl` (refused by default; the production host is always refused).
- `--report=<path>` — write a JSON report (per-check status, reason, and request/response evidence).
- `--stripe=sandbox` — drive the real hosted Stripe Checkout with test card `4000 0000 0000 0077`; best effort,
  SKIPped when the environment is simulated or Stripe keys are missing.
- `--admin-email` / `--admin-password` — admin credentials (defaults `admin@gmail.com` / `adminBR@123`).
- `--headed` — run the browser headed, for debugging.

An unknown flag is refused (exit `2`) instead of being silently ignored.

It needs only Playwright's bundled Chromium and `fetch` — no extra dependencies. Bun drives Chromium on
Windows, so the `qa` script runs it with Bun. The file is plain ESM-compatible TypeScript: if an environment
ever cannot drive Chromium under Bun, run it unchanged with `node --experimental-strip-types qa.ts`.

## Safety

The script creates accounts and data and hammers endpoints, so:

- It refuses any non-local host unless `--allow-remote` is passed, and never targets the production host.
- Destructive checks (rate-limit exhaustion, cross-user abuse) only ever act on the accounts it created.
- Each simulated user runs under its own `x-forwarded-for`, so per-IP rate limits don't bleed across users.

## What it covers

Organised as named suites; each check is `PASS`/`FAIL`/`SKIP` with a one-line reason. A failing check never
aborts the run, and the process exits `1` if anything failed. The one exception is the account setup (two
signups and the admin login): every later suite depends on it, so a failure there is recorded as a single
`run aborted` FAIL, and the summary and the JSON report are still produced for what ran before it.

1. **Pages and links** — every public route returns 200 with a title in en/pt/es (Accept-Language and the
   locale cookie); legacy Portuguese routes 301 to the English ones; unknown route is 404; no console errors,
   failed same-origin requests or CSP violations; every internal link resolves.
2. **UI interactions** — sidebar nav, locale switcher, theme toggle, mobile menu at 390px, and form
   validation messages.
3. **Auth** — signup, login, wrong password, protected pages when logged out, change password (current
   password required), reserved nicknames rejected, `/admin` 404 for anonymous.
4. **Authorization** — (4a) every API route under `app/api` is enumerated from the filesystem at runtime and
   called unauthenticated: protected routes must answer 401/403/404 (never 2xx with data, never 5xx), public
   endpoints must not 5xx, secret/webhook routes must be 4xx. (4b) with user A's session, acting on user B's
   objects is refused; `/admin` is 404 for non-admins and renders for the admin.
5. **Injection and abuse** — SQL injection in login, query strings and JSON bodies (never 5xx, never a
   bypass); XSS payloads stored through the real API in the profile name/description and in a question and
   its answer, then rendered on the profile, the inbox, the sent list and the feed: no dialog, no injected
   DOM node, and the payload visible as plain text; malformed/garbage POST bodies (bad JSON, wrong types, oversized,
   negative/zero/huge/float amounts) never 5xx.
6. **Money — PIX rail** — A asks B by PIX (charge created, confirmed, question created); body amount is
   ignored; reusing a paid charge is refused; another user's charge is refused; B answers and the payout
   reflects `calculatePayout`; withdraw below the minimum is blocked in the UI.
7. **Money — Stripe credits rail** — buying credits increases the balance exactly; invalid amounts refused;
   asking with credits debits exactly (self and over-balance refused; concurrent double spend debits once); B
   registers a payout account and answers (settlement verified through the admin dashboard counters); a
   refused credit question refunds the asker exactly once.
8. **Robustness** — rapid repeated signups create exactly one usable account; the login rate limit eventually returns
   429 and recovers for a different account (SKIP with a reason if the environment disables it).
9. **Stripe sandbox (optional)** — drives the real hosted Stripe Checkout; SKIPped unless `--stripe=sandbox`
   and real Stripe test keys are present.

## Reading the report

The console prints each check as `[PASS|FAIL|SKIP] <name> — <reason>`, a per-suite summary table, then a
`FAIL`/`PASS`/`SKIP` total. Failures are listed again at the end with the observed status and a short response
body excerpt. The `--report` JSON contains `{ target, generatedAt, totals, checks[] }`, where each check holds
its suite, name, status, reason, and `evidence.sent` / `evidence.got` (what was sent and what came back) so a
failure is reproducible without re-running.

### Notes for the Docker demo

- The Vercel Speed Insights script (`/_vercel/speed-insights/script.js`) 404s off-Vercel; this is expected in
  the self-hosted demo (analytics are disabled there) and is filtered out of the "no console errors" check.
- Simulated mode confirms PIX on the first status check and fakes Stripe checkout/onboarding/transfers, so
  both payment rails run end to end with no external account.
