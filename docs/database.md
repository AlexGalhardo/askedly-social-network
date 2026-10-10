# Database

ORM: Prisma 7 (`@prisma/client` + driver adapter). Production and default dev: **PostgreSQL**, defined in `prisma/schema.prisma` (`provider = "postgresql"`).

## How Prisma 7 is configured

- **`prisma.config.ts`** (root) is the CLI configuration: schema, migrations, seed command and the URL (`DATABASE_URL`, loaded through `dotenv`). In Prisma 7 the URL no longer lives in `schema.prisma`, and the seed no longer lives in `package.json#prisma`.
- **Generated client** in `prisma/generated/prisma/` (`prisma-client` generator, ignored by git). Run `bun run prisma:generate` after `bun install` or after changing the schema, because Prisma 7 no longer generates the client by itself.
- **Single instance** in `prisma/prisma-client.ts`: `import { prisma } from "@/prisma/prisma-client"`. Never create `new PrismaClient()` anywhere else, because each instance opens its own connection pool. It uses the `@prisma/adapter-pg` adapter for Postgres and `@prisma/adapter-libsql` when `DATABASE_URL` starts with `file:`.

## Models (summary)

| Model | Role |
| --- | --- |
| `User` | account, public profile, privacy settings (`privacy_*`), daily question limits, `credits_cents` (credits in US dollar cents), `stripe_account_id` (connected account), `is_admin` |
| `Question` | paid question. `currency` tells the rail: `BRL` (PIX, linked 1:1 to a `WebhookAbacatePay` through `webhook_id`) or `USD` (credits, no `webhook_id`, with `stripe_transfer_id` after the payout) |
| `StripePurchase` | credit purchase through Stripe Checkout (`pending`, `completed`, `expired`); the webhook credits it once |
| `WebhookAbacatePay` | raw events received from the PIX gateway — source of truth for the payment |
| `Follower` / `FollowRequest` | social graph; `FollowRequest` only exists for private profiles |
| `UserBlock` | blocks between users |
| `PaymentWithdraw` | withdrawals of the accumulated balance through a PIX key |
| `DeletedAccount` | snapshot of a deleted account (soft delete + audit) |
| `RateLimit` | fixed rate limit window per key (`lib/services/rate-limit.service.ts`); expired rows are removed by the daily cron |

All IDs are UUIDs (`@default(uuid())`). Table names are `snake_case` through `@@map`.

## Commands

```bash
bun run prisma:generate   # generates the client
bun run prisma:migrate    # creates/applies a migration in dev
bun run prisma:studio     # database GUI
bun run prisma:db:seed    # fills it with fake data (see prisma/seed.ts)
```

## SQLite for local dev (without Docker)

`prisma/schema.prisma` remains Postgres (production). The `setups/setup-*-sqlite.sh` scripts write `DATABASE_URL="file:./dev.db"` to `.env`; with that prefix, `prisma.config.ts` uses the mirrored schema `prisma/schema.sqlite.prisma` and the client uses the libSQL adapter. There are no migrations for SQLite: the schema is applied with `bunx prisma db push`.

- libSQL instead of `better-sqlite3`: `better-sqlite3` does not run on Bun, which executes the seed and the scripts.
- The seed runs on SQLite: `skipDuplicates` (not supported there) is only sent on Postgres (`SeedDatabaseConfig.skipDuplicates`).
- The rate limit is turned off on SQLite: it only exists in local dev.

**Important:** this mirror schema is not generated automatically — whenever `prisma/schema.prisma` changes, replicate the change by hand in `prisma/schema.sqlite.prisma`. Types with no direct SQLite equivalent (nothing very exotic is used today) need a manual adjustment in that file.

## Hosted Postgres (Neon through the Vercel Marketplace)

The app reads a single variable, `DATABASE_URL`, and that is what selects the database a deployment uses. Two Marketplace resources exist on the Vercel project:

| Resource | Provider | Variables it injects |
| --- | --- | --- |
| `askedly-db` | Neon Postgres | `NEON_*`, e.g. `NEON_DATABASE_URL` (pooled) and `NEON_DATABASE_URL_UNPOOLED` (direct) |
| `respondeae-db` | Prisma Postgres | the previous database |

Provisioning Neon:

```bash
vercel integration add neon --name askedly-db --prefix NEON_
vercel env pull .env.neon.local   # local copy of the injected variables; never commit it
```

The `--prefix NEON_` keeps the integration from overwriting `DATABASE_URL`: nothing changes for the app until you point `DATABASE_URL` at the database you want (`vercel env add DATABASE_URL production`, then a new deployment).

- **Runtime** uses the pooled URL (`NEON_DATABASE_URL`): serverless functions open many short connections.
- **Migrations and seed** use the unpooled URL (`NEON_DATABASE_URL_UNPOOLED`): `prisma migrate` needs a direct connection, not the pooler.

```bash
DATABASE_URL="<NEON_DATABASE_URL_UNPOOLED>" bunx prisma migrate deploy
```

## Seed

`prisma/seed-orchestrator.ts` calls the `services/` and `factories/` in `prisma/` to generate fake users, questions and follower relations. The amount is controlled by `SEED_TOTAL_RANDOM_USERS_TO_CREATED`, `SEED_TOTAL_FOLLOWERS_RELATIONS` and `SEED_RANDOM_QUESTIONS_TO_CREATE` in `.env`. Set them explicitly: the fallbacks when they are missing are very large (100,000 users, 500,000 follower relations, 50,000 questions).

The seed also creates the admin account (`admin@gmail.com` / `adminBR@123`) and, through `services/seed-payments-demo.service.ts`, the payment data that feeds the `/admin` panel: credit purchases, questions paid with credits in several states, PIX questions of the admin and a withdrawal.

**The seed wipes every table before filling them: never run it against a database with real data.**

Seeding a hosted database (against the unpooled URL, after `prisma migrate deploy`):

```bash
DATABASE_URL="<NEON_DATABASE_URL_UNPOOLED>" \
SEED_TOTAL_RANDOM_USERS_TO_CREATED=1000 \
SEED_TOTAL_FOLLOWERS_RELATIONS=5000 \
SEED_RANDOM_QUESTIONS_TO_CREATE=2000 \
bun prisma/seed.ts
```

The follower and question counts above are examples; pick what you need. Random users are built from profiles fetched one by one from an external API (`https://randomuser.me`, in `prisma/factories/seed-user.factory.ts`), so 1000 users take several minutes and the seed needs internet access.
