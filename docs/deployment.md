# Deployment

## Vercel

Project `respondeae` in the team `galhardos-projects`. The Vercel project was not renamed along with the repository; the production domain is **`https://askedly-social-network.vercel.app`** (the old `respondeae.vercel.app` is still attached).

The intended flow is the **Vercel Git integration**: every push to `main` becomes a production deployment and every PR gets a preview.

> **Current state:** after the GitHub repository was renamed to `askedly-social-network`, pushes to `main` stopped triggering deployments. Until the Git integration is reconnected (project Settings > Git), production is deployed from the CLI with `vercel deploy --prod`. See [`vercel-deploy.md`](vercel-deploy.md).

- The build runs the `vercel-build` script (`infra/vercel-build.sh`), which Vercel prefers over `build`:
  1. `prisma generate` — the Prisma 7 client lives in `prisma/generated/`, outside git; without it the build fails with `Can't resolve './generated/prisma/client'`;
  2. `prisma migrate deploy` **only when `VERCEL_ENV=production`** — preview and production use the same `DATABASE_URL`, and a PR with a new migration must not change the production database just because it generated a preview;
  3. `next build`.
- The build needs no runtime secret (the Resend client is created at send time).
- `vercel.json` defines a cron (`/api/cronjob`, every day at 3 a.m.) that resets the daily question limits, deletes accounts removed more than 30 days ago or inactive for more than 2 years and cleans up expired rate limit windows. The route requires `Authorization: Bearer $CRON_SECRET`, which Vercel sends by itself when the variable exists in the project.
- `@vercel/speed-insights` is already integrated in `app/layout.tsx`.

### Environment variables (Vercel dashboard)

`lib/env.ts` validates the variables with Zod every time `next.config.ts` loads (build and start). **Essential** (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`): missing or invalid, the build fails and the deployment does not go out. **Optional** (PIX, Stripe, captcha, Google, emails, upload, Telegram, cron): missing, the feature stays off and the build only warns with `[env] ...`; a feature with half of its variables is also reported. `SKIP_ENV_VALIDATION=true` skips the check and exists only for the Docker image build.

`.env.example` is the reference. Besides the ones the project already has, production needs:

- `CRON_SECRET` — without it the daily cron gets a 401 and nothing is cleaned up;
- `RESEND_FROM_EMAIL` — a sender on a domain verified in Resend; without it, password reset emails only reach the owner of the Resend account;
- `ABACATEPAY_API_KEY`/`ABACATEPAY_WEBHOOK_SECRET` with the **new** key (the old one was exposed in the bundle and must be rotated);
- `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` and `CLOUDFLARE_TURNSTILE_SECRET` — the captcha is optional and is on only with **both**; without them login, signup and contact are protected by the rate limit alone;
- `NEXT_PUBLIC_TEST_MODE` must be `false` (or not exist) in production. Even when on, `simulate-payment` refuses when `VERCEL_ENV=production`.

`NODE_ENV` must not be set by hand (Vercel sets it), and `SEED_*`/`DANGER_MODE` are not used in production.

### Database

`DATABASE_URL` selects the database a deployment uses. Two Marketplace resources exist on the project: the Neon Postgres database `askedly-db` (injects `NEON_*` variables) and the earlier Prisma Postgres resource `respondeae-db`. Provisioning and seeding are described in [`database.md`](database.md#hosted-postgres-neon-through-the-vercel-marketplace).

### Stripe

The Stripe sandbox `askedly-stripe` was also provisioned through the Marketplace and injects `STRIPE_SECRET_KEY`; `STRIPE_WEBHOOK_SECRET` is stored with `vercel env add`. Buying credits works in the sandbox; payouts need Connect, which requires claiming the sandbox first. See [`stripe-setup.md`](stripe-setup.md).

### Domains and deployment protection

Production answers at **`https://askedly-social-network.vercel.app`** (public). The project uses Vercel Authentication, so the other `*.vercel.app` domains (e.g. `respondeae-galhardos-projects.vercel.app` and the URL of each deployment) redirect to the Vercel login. That is why the AbacatePay and Stripe webhooks and `NEXT_PUBLIC_APP_URL`/`NEXTAUTH_URL` must use `askedly-social-network.vercel.app` (or a custom domain). Verified in production: `/api/health` 200, security headers present, webhook and cron without a secret answer 401.

## CI/CD (GitHub Actions, `.github/workflows/`)

- **`ci.yml`** (PR and push to `main`): jobs `lint` (Biome lint and format check, plus markdownlint), `typecheck` (`tsc --noEmit`), `security-audit` (`bun audit --audit-level=high`), `unit-tests`, `integration-tests` (Postgres in a service container) and `build` (Postgres + `bun run test:smoke`).
- **`e2e.yml`** (PR and push to `main`): starts Postgres in a service container, installs Playwright's Chromium, runs `bun run build` and `bun run test:e2e` (production server). On failure, it uploads the HTML report (`playwright-report/`, generated only with `CI=true`) as an artifact.
- Deployment does **not** go through GitHub Actions: the Vercel Git integration is meant to do it (the old `deploy.yml` was removed to avoid a duplicated deployment). For production to go out only with green CI, enable "Deployment Checks" on the Vercel project requiring the `CI` and `E2E` checks.
- Every workflow uses `concurrency` to cancel older runs of the same branch.
- **Dependabot** (`.github/dependabot.yml`): `bun` ecosystem (the default `npm_and_yarn` failed because it does not know how to update `bun.lock`) and `github-actions`, weekly, minor/patch grouped.

### Every job blocks

- `lint` runs `bun run lint:ci`, which also fails on a Biome **warning** (`--error-on-warnings`), then `bun run format:ci` and `bun run lint:md`.
- `typecheck` (`tsc --noEmit`, no `ignoreBuildErrors` in `next.config`).
- `security-audit` (`bun audit --audit-level=high`). Two exceptions, both in development tooling that never runs in production: `GHSA-ggr8-5vv4-36mx` (`deepmerge-ts`, only in the Prisma CLI) and `GHSA-vfj7-8cjw-p6xm` (`braces`, only in markdownlint; no fixed version published, and the glob patterns come from our own configuration). `seroval` (through the React Query devtools) is pinned in `overrides` to a fixed version.
- `unit-tests` runs `prisma:generate` first: some unit tests import services that import the client.
- The e2e runs against `next build` + `next start` (production), with Cloudflare's official test keys for Turnstile (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`), which always pass.
- Smoke and e2e start Next with **Node**, as on Vercel: under the Bun runtime the modules Turbopack externalizes (`@prisma/client`, `pg`) do not resolve.

### Validating workflows locally

```bash
docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:1.7.7
```

## Local build before deploying

```bash
bun install
bun run build
bun run start   # validates the production build locally
```

The build runs real Prisma queries on static pages (e.g. `/top-liked`) — `DATABASE_URL` must point to a reachable Postgres at build time too, not only at runtime. The build also validates the environment (`lib/env.ts`): the four essential variables must be set.
