# Full application in Docker (demo mode)

Brings up the whole product with no external account at all: Postgres, migrations, seed and the app in a production build, with simulated payments.

```bash
docker compose -f infra/docker-compose.demo.yaml up --build
```

Open <http://localhost:3000>. To reset everything: `docker compose -f infra/docker-compose.demo.yaml down -v`.

Port 3000 taken? `APP_PORT=3300 docker compose -f infra/docker-compose.demo.yaml up --build` (the port goes into the build, hence the `--build`).

## Seed accounts

| Account | Email | Password |
| --- | --- | --- |
| Admin (panel at `/admin`) | `admin@gmail.com` | `adminBR@123` |

The seed also creates 60 random users, followers, 200 PIX questions in every state and the demo payment data (`prisma/services/seed-payments-demo.service.ts`): completed and expired credit purchases, 24 questions paid with credits (answered, waiting and declined), PIX questions received by the admin, a withdrawal in the history, and the admin with US$ 50 of credits and a payout account already registered.

## What each service does

| Service | Role |
| --- | --- |
| `db` | Postgres 17, volume `demo_pgdata` |
| `setup` | Runs once (`infra/demo-setup.sh`): `prisma migrate deploy` and, only if the database is empty, the seed |
| `app` | `next start` on port 3000, after `setup` finishes successfully |

## Simulated payments

`PAYMENTS_SIMULATED=true` (`lib/payment-simulation.ts`) replaces the calls to the gateways with local responses:

| Action | In production | In demo mode |
| --- | --- | --- |
| Generate a PIX | charge on AbacatePay | fictitious charge `sim_...`, with a 1-pixel QR code |
| Confirm a PIX | webhook or polling | the modal's first check already returns `PAID` (about 5 s) |
| Buy credits | Stripe Checkout + webhook | credited on the spot, without leaving the app |
| Register a payout account | Stripe onboarding | account `acct_sim_...` stored on the spot |
| Payout on answering | `transfers.create` | transfer `tr_sim_...` recorded |

The rest of the code is the same as in production: credit debit, settlement, platform fee, withdrawal and admin panel run for real against the database.

**This gives away free money.** The variable is ignored when `VERCEL_ENV=production`. Outside Vercel, never set it in an environment with real users.

## Walkthrough to see everything working

1. Sign in as `admin@gmail.com` and open `/admin`: totals per currency, platform revenue, purchases and withdrawals.
2. In My Account, buy credits: the balance goes up on the spot.
3. Open another user's profile and send a question, once by PIX (it confirms by itself) and once with credits.
4. In Payments, withdraw the admin's PIX balance (minimum of R$ 100).
5. Switch the language in the selector in the sidebar.

## Automated check

`tests/e2e/demo-check.mjs` walks through the running stack with Playwright's Chromium: language by `Accept-Language`, admin login with captcha, panel, simulated credit purchase, question paid with credits (debit verified), refusals (nonexistent owner, insufficient balance), simulated PIX and absence of CSP violations.

```bash
docker compose -f infra/docker-compose.demo.yaml exec db   psql -U postgres -d askedly_demo -Atc "select id, nickname from users where not is_admin limit 1"
node tests/e2e/demo-check.mjs http://localhost:3000 <id> <nickname>
```

## Details

- The image is built with `SKIP_ENV_VALIDATION=true` (`infra/Dockerfile`): the build does not have the runtime variables, which only arrive when the container starts.
- The captcha uses Cloudflare Turnstile's official test keys, which always pass. The browser must be able to reach `challenges.cloudflare.com`.
- Emails (password reset, contact), avatar upload, Google login and Telegram logs have no key and do not work in demo mode.
- The daily cron does not run by itself. To trigger it: `curl -H "Authorization: Bearer docker-demo-cron" http://localhost:3000/api/cronjob`.
- `NEXTAUTH_SECRET` and `CRON_SECRET` in the compose file are public demo values. Do not reuse them.
- Database only, to develop with `bun run dev`: `infra/docker-compose.yaml` and the scripts in `setups/`.
