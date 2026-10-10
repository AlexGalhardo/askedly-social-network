<h1 align="center">Askedly Social Network</h1>

<p align="center">A global Q&A social network where every question is paid, by PIX or with credits through Stripe.</p>

<p align="center">
 <a href="https://github.com/AlexGalhardo/askedly-social-network/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/AlexGalhardo/askedly-social-network/actions/workflows/ci.yml/badge.svg?branch=main"></a>
 <a href="https://github.com/AlexGalhardo/askedly-social-network/actions/workflows/e2e.yml"><img alt="E2E" src="https://github.com/AlexGalhardo/askedly-social-network/actions/workflows/e2e.yml/badge.svg?branch=main"></a>
 <a href="LICENSE.md"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
 <a href="CHANGELOG.md"><img alt="Version" src="https://img.shields.io/badge/version-1.0.0-green.svg"></a>
</p>

## About

On Askedly Social Network everyone has a public profile where they receive questions, as on Retrospectiva or NGL, with one difference: whoever asks pays for it. Whoever answers gets part of that amount; if they do not answer in time, the question expires. The product is shown as **Askedly** in the interface; "Askedly Social Network" is the name of this repository and project.

- Public or anonymous questions, with public or private answers
- Payment by PIX through [AbacatePay](https://abacatepay.com), confirmed by webhook, withdrawn to the answerer's own PIX key
- Payment with US dollar credits bought by card on [Stripe](https://stripe.com), with automatic payout to the answerer through Stripe Connect
- Interface in English (default), Portuguese and Spanish
- Community feed and a feed of the people you follow, plus a ranking of the most liked answers
- Public or private profiles, with followers, blocks and several privacy options
- Login with email and password or with Google

## Stack

| Layer | Technology |
| --- | --- |
| App | [Next.js](https://nextjs.org) 16 (App Router) + [React](https://react.dev) 19 + TypeScript 7 |
| Data | [PostgreSQL](https://www.postgresql.org) + [Prisma](https://www.prisma.io) 7 (SQLite optional for local dev) |
| Auth | [NextAuth](https://next-auth.js.org) 4 (credentials + Google) and, optionally, [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) |
| Payments | [AbacatePay](https://abacatepay.com) (PIX) and [Stripe](https://stripe.com) (credits + Connect) |
| Email and uploads | [Resend](https://resend.com) + React Email, [UploadThing](https://uploadthing.com) |
| UI | Tailwind CSS 4 (CSS-first), [Base UI](https://base-ui.com), TanStack Query 5, [next-intl](https://next-intl.dev) |
| Quality | Bun 1.4 (package manager and test runner), Biome, markdownlint, Playwright, Husky + commitlint |
| Deployment | [Vercel](https://vercel.com); CI on GitHub Actions |

## Running locally

Prerequisite: [Bun](https://bun.sh) 1.4.2. Pick the script for your system and database; each one installs dependencies, creates `.env`, prepares the database and runs the seed:

| | SQLite (nothing to install) | Postgres already installed | Postgres through Docker |
| --- | --- | --- | --- |
| **Windows** (Git Bash) | [`setup-windows-using-sqlite.sh`](setups/setup-windows-using-sqlite.sh) | [`setup-windows-using-postgres.sh`](setups/setup-windows-using-postgres.sh) | [`setup-windows-using-postgres-with-docker.sh`](setups/setup-windows-using-postgres-with-docker.sh) |
| **Linux/macOS** | [`setup-unix-using-sqlite.sh`](setups/setup-unix-using-sqlite.sh) | [`setup-unix-using-postgres.sh`](setups/setup-unix-using-postgres.sh) | [`setup-unix-using-postgres-with-docker.sh`](setups/setup-unix-using-postgres-with-docker.sh) |

```bash
git clone git@github.com:AlexGalhardo/askedly-social-network.git
cd askedly-social-network
bash setups/setup-unix-using-postgres-with-docker.sh   # or the script from the table above
bun run dev
```

Environment variables are documented in [`.env.example`](.env.example). They are validated at build time (`lib/env.ts`): a missing essential variable fails the build, a missing optional one only turns its feature off and warns.

### Everything in Docker, with no external account

Brings up Postgres, migrations, seed and the app, with simulated payments (PIX confirms by itself, fictitious Stripe credits and payouts):

```bash
docker compose -f infra/docker-compose.demo.yaml up --build
```

Open <http://localhost:3000> and sign in with `admin@gmail.com` / `adminBR@123` (panel at `/admin`). Details in [`docs/docker.md`](docs/docker.md).

## Commands

```bash
bun run dev               # development server
bun run build             # production build (needs a reachable Postgres)
bun run lint              # Biome (lint + format)
bun run test              # unit tests
bun run test:integration  # integration against a disposable Postgres
bun run test:e2e          # Playwright
bun run prisma:studio     # database GUI
```

## Documentation

The [`docs/`](docs) folder explains the project by area (it is also the context AI agents use, through [`AGENTS.md`](AGENTS.md)):

- [Architecture and security rules](docs/architecture.md)
- [Database](docs/database.md)
- [Authentication](docs/auth.md)
- [PIX payments](docs/payments-pix.md)
- [Stripe payments (credits and Connect)](docs/payments-stripe.md) and [how to set up Stripe](docs/stripe-setup.md)
- [Internationalization](docs/i18n.md)
- [Emails](docs/email.md)
- [Uploads](docs/uploads.md)
- [Telegram bot](docs/telegram-bot.md)
- [Tests](docs/testing.md)
- [Deployment and CI/CD](docs/deployment.md) and the [Vercel deployment walkthrough](docs/vercel-deploy.md)
- [Docker (demo mode)](docs/docker.md)
- [Tooling](docs/tooling.md)
- [Security (OWASP Top 10:2025 audit)](docs/security.md)

## Contributing

Read [`CONTRIBUTE.md`](CONTRIBUTE.md). Security flaws: [`SECURITY.md`](SECURITY.md), never in a public issue.

Code, comments, documentation and commit messages are in English. The interface is translated (English by default, Portuguese and Spanish); user content is never translated.

Commits follow [Conventional Commits](https://www.conventionalcommits.org) (validated by commitlint) and versioning follows [SemVer](https://semver.org). Before opening a PR, `bun run lint:ci`, `bun run lint:md`, `bunx tsc --noEmit`, `bun run build` and the tests must pass: CI blocks on all of them. Notable changes go into [`CHANGELOG.md`](CHANGELOG.md).

## Credits and license

Created by [Alex Galhardo](https://github.com/AlexGalhardo). Distributed under the [MIT license](LICENSE.md).
