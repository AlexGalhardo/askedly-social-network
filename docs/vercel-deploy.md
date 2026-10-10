# Deploying to Vercel

How deployment works (build, cron, CI) is in [`deployment.md`](deployment.md). This file is the walkthrough for getting it live, by hand or through an AI agent.

Current project: `respondeae`, team `galhardos-projects`, production at `https://askedly-social-network.vercel.app` (the old `respondeae.vercel.app` is still attached). The Vercel project was not renamed along with the repository.

> **Git integration is disconnected for now.** After the GitHub repository was renamed, pushes to `main` stopped triggering deployments. Until the integration is reconnected (project Settings > Git), production is deployed with `vercel deploy --prod`.

## Manual version, step by step

1. **CLI.** `bun add --global vercel` and `vercel login`.
2. **Link** the folder to the project (creates `.vercel/`, which stays out of git):

   ```bash
   vercel link --project respondeae --scope galhardos-projects
   ```

   New project: `vercel link` without `--project` creates one, and the Git integration is connected in Settings > Git.
3. **Database.** A Postgres reachable from the internet in `DATABASE_URL`. Through the Vercel Marketplace, Neon:

   ```bash
   vercel integration add neon --name askedly-db --prefix NEON_
   ```

   This injects `NEON_*` variables into the project (e.g. `NEON_DATABASE_URL`, pooled, and `NEON_DATABASE_URL_UNPOOLED`, direct). The app reads `DATABASE_URL`, so point it at the database you want: the pooled URL for runtime. The project also has the earlier Marketplace Prisma Postgres resource `respondeae-db`; `DATABASE_URL` selects which database a deployment uses.

   To apply migrations and seed a fresh database, use the unpooled URL (the seed wipes every table first; see [`database.md`](database.md#seed)):

   ```bash
   DATABASE_URL="<NEON_DATABASE_URL_UNPOOLED>" bunx prisma migrate deploy
   DATABASE_URL="<NEON_DATABASE_URL_UNPOOLED>" SEED_TOTAL_RANDOM_USERS_TO_CREATED=1000 \
     SEED_TOTAL_FOLLOWERS_RELATIONS=5000 SEED_RANDOM_QUESTIONS_TO_CREATE=2000 bun prisma/seed.ts
   ```

   The seed fetches random profiles from an external API, so 1000 users take several minutes.
4. **Environment variables.** `.env.example` is the list. For each one:

   ```bash
   vercel env add NAME production   # asks for the value without showing it; repeat with `preview` when it makes sense
   vercel env ls
   ```

   Essential (the build fails without them, see `lib/env.ts`): `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`. Needed in production although the build only warns: `CRON_SECRET`, and `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` + `CLOUDFLARE_TURNSTILE_SECRET` (the captcha is on only with both). Per feature: `ABACATEPAY_*` (PIX), `STRIPE_*` (credits, see [`stripe-setup.md`](stripe-setup.md)), `RESEND_*` (emails), `UPLOADTHING_TOKEN` (avatar), `GOOGLE_*` (Google login), `TELEGRAM_*` (logs). Never set `PAYMENTS_SIMULATED`, `NEXT_PUBLIC_TEST_MODE=true` or `NODE_ENV`.
5. **Deploy.** While the Git integration is disconnected, deploy from the CLI:

   ```bash
   vercel deploy           # preview
   vercel deploy --prod    # production
   ```

   Once the integration is reconnected, the normal path is `git push origin main`: the Git integration does the production deployment, and each PR gets a preview.

   The build runs `infra/vercel-build.sh`: `prisma generate`, `prisma migrate deploy` (production only) and `next build`.
6. **Check.**

   ```bash
   curl -s https://askedly-social-network.vercel.app/api/health                                   # 200
   curl -s -o /dev/null -w "%{http_code}\n" https://askedly-social-network.vercel.app/api/cronjob # 401 without the secret
   curl -s -o /dev/null -w "%{http_code}\n" -X POST https://askedly-social-network.vercel.app/api/webhook/stripe   # 400 without a signature
   vercel logs https://askedly-social-network.vercel.app
   ```

7. **Roll back.** `vercel rollback` returns production to the previous deployment. A migration that was already applied is not undone: migrations must be additive.

## Version with AI agents (CLI and MCP)

**Prerequisites only you can provide:** `vercel login` done (the agent checks with `vercel whoami`), or the Vercel MCP connected; and the secret values, typed by you or already stored in the project. The agent must not read `.env` or ask for a secret in the chat.

**Request for the agent:**

```text
Do the production deployment of this project on Vercel following docs/vercel-deploy.md:
1. `vercel whoami` and `vercel link --project respondeae --scope galhardos-projects --yes`.
2. Compare `vercel env ls production` with .env.example and list what is missing. Do not print values.
3. Validate like CI first: `bun run lint:ci`, `bun run lint:md`, `bunx tsc --noEmit`, `bun run test`, `bun run build`.
4. Deploy with `vercel deploy --prod` (pushes to main do not deploy until the Git integration is reconnected)
   and follow the deployment until READY (`vercel ls`, `vercel inspect <url>`).
5. Run the checks from step 6 of the manual walkthrough against https://askedly-social-network.vercel.app
   and show the HTTP codes.
6. If the deployment fails, read the build log (`vercel inspect <url> --logs`), fix the cause and repeat.
   Do not use `vercel rollback` without asking me.
```

**What each tool covers:**

| Task | CLI | MCP (`vercel` server) |
| --- | --- | --- |
| Link and deploy | `vercel link`, `vercel deploy --prod` | `create_deployment` |
| State and logs | `vercel ls`, `vercel inspect --logs`, `vercel logs` | `list_deployments`, `get_deployment`, `get_runtime_logs`, `get_runtime_errors` |
| Environment variables | `vercel env add`, `vercel env ls`, `vercel env rm` | `create_project_env`, `filter_project_envs`, `edit_project_env` |
| Marketplace resources (Neon, Stripe) | `vercel integration add`, `vercel integration resource claim` | `list_integration_configurations` (read only) |
| Promote and revert | `vercel promote`, `vercel rollback` | `request_promote`, `request_rollback` |
| Domains | `vercel domains`, `vercel alias` | `add_project_domain`, `verify_project_domain` |

**Rules for the agent:** a production deployment, changing a production variable, a rollback and buying a domain need your confirmation; a secret never shows up in a log, commit or reply; if CI is red, the agent fixes the cause instead of skipping a hook or a test.

## After the first deployment

- Register the webhooks with the production URL: AbacatePay (`/api/webhook/abacatepay?webhookSecret=...`) and Stripe (`APP_URL=https://askedly-social-network.vercel.app bun infra/stripe-setup.ts`).
- Reconnect the Git integration (Settings > Git) to the renamed repository, so pushes to `main` deploy again.
- Enable Deployment Checks (Settings > Deployment Checks) requiring the `CI` and `E2E` checks, so that production only goes out with green CI.
- Own domain: Settings > Domains, then update `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL` and the webhook URLs.
