# Setting up Stripe

What the app needs from Stripe: an API key, a webhook endpoint and, for payouts, Connect enabled. The payment flow is in [`payments-stripe.md`](payments-stripe.md).

## Current state of this project

| Piece | State |
| --- | --- |
| Stripe sandbox `askedly-stripe` | Provisioned through the Vercel Marketplace; injects `STRIPE_SECRET_KEY` into the Vercel project (plus a publishable key and MCP keys the app does not use) |
| Webhook endpoint | Created with `bun infra/stripe-setup.ts`; `STRIPE_WEBHOOK_SECRET` stored with `vercel env add` |
| Buying credits | Works in the sandbox |
| Stripe Connect (payouts) | **Not enabled.** It cannot be turned on by API or CLI on an unclaimed sandbox. The owner must claim the sandbox and enable Connect in the dashboard |

## Manual version, step by step

1. **Tools.** Vercel CLI (`bun add --global vercel`, `vercel login`, `vercel link`) and Stripe CLI:

   ```bash
   npm i -g @stripe/cli
   stripe login
   ```

2. **Account or sandbox.** Either of the two:

   - **Through the Vercel Marketplace** (what this project uses). Creates a Stripe sandbox and injects the keys into the Vercel project in one step:

     ```bash
     vercel integration add stripe --name askedly-stripe --no-claim
     ```

     `--no-claim` leaves the sandbox unclaimed: it works for Checkout and webhooks right away, with no Stripe account. The integration sets `STRIPE_SECRET_KEY`, plus a publishable key and MCP keys that the app does not use.
   - **Directly on Stripe.** Create or open the account at <https://dashboard.stripe.com>. To test, use a sandbox (top left corner, "Sandboxes"): data and keys separate from the real account. In Developers > API keys, create a **restricted key** (`rk_...`) with write access to: Checkout Sessions, Transfers, Connect (v2 accounts and account links) and Webhook Endpoints (the last one only for the script in step 3; it can be removed afterwards). Store it as `STRIPE_SECRET_KEY`.
3. **Webhook.** With the app's public URL and the key in the shell environment:

   ```bash
   STRIPE_SECRET_KEY=sk_... APP_URL=https://askedly-social-network.vercel.app bun infra/stripe-setup.ts
   ```

   The script creates the endpoint `https://<your-domain>/api/webhook/stripe` with the four Checkout events and prints `STRIPE_WEBHOOK_SECRET=whsec_...`. Running it again only updates the events (the secret is shown only on creation). Through the dashboard, the equivalent is Developers > Webhooks > Add endpoint, with the events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` and `checkout.session.expired`.
4. **Variables.** Store `STRIPE_WEBHOOK_SECRET` (and `STRIPE_SECRET_KEY`, if it did not come from the Marketplace) on Vercel and in the local `.env`. Never with the `NEXT_PUBLIC_` prefix.

   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET production   # asks for the value without showing it
   ```

   Then deploy again so the new variable takes effect (see [`vercel-deploy.md`](vercel-deploy.md)). With only one of the two variables set, the build warns that Stripe is half configured (`lib/env.ts`).
5. **Check the purchase.** Logged in to the app, in My Account: buy credits with the test card `4000 0000 0000 0077` (it lands directly in the available balance) and check the credit balance. This works without Connect.
6. **Connect (needed for payouts).** The app creates a connected account for whoever receives questions and transfers the payout to it, which only a Connect platform can do. On an unclaimed sandbox there is no way to enable it by API or CLI: `stripe tools enable_connect` answers `Only Stripe Connect platforms can work with other accounts`. The owner has to:

   1. claim the sandbox, which attaches it to a Stripe account:

      ```bash
      vercel integration resource claim askedly-stripe
      ```

   2. enable Connect in the Stripe dashboard: Settings > Connect > platform setup, filling in the platform profile ("marketplace" model: the platform charges, then pays out).

   Then, in My Account, register the payout account, send and answer a question paid with credits and see the transfer in Connect > Transfers. Until Connect is on, questions paid with credits and answered stay pending and the daily cron retries the settlement.

### Webhook in local development

Stripe cannot reach `localhost`. With the [Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhook/stripe   # prints the local whsec_
stripe trigger checkout.session.completed                       # test event
```

Put the printed `whsec_...` in `STRIPE_WEBHOOK_SECRET` in the local `.env` while `stripe listen` is running.

With no account at all, use the demo mode in [`docker.md`](docker.md).

## Version with AI agents (CLI and MCP)

An agent with terminal access does steps 2 to 5. Step 6 depends on accepting terms and on company data: it is yours.

**Prerequisites only you can provide:**

- Vercel CLI authenticated (`vercel whoami`) and the project linked (`vercel link`).
- Stripe CLI installed (`npm i -g @stripe/cli`) and authenticated (`stripe login`), or the Stripe MCP connected (`/mcp`, `stripe` server, which opens the login in the browser), or the restricted key in an environment variable of the session. With the Marketplace sandbox, the key already lives in the Vercel project.

**Request for the agent:**

```text
Set up Stripe for this project in test mode, following docs/stripe-setup.md:
1. Check access: `vercel whoami` and, if the Stripe CLI is logged in, `stripe whoami --format json`.
2. If the project has no STRIPE_SECRET_KEY, provision the sandbox:
   `vercel integration add stripe --name askedly-stripe --no-claim`.
3. Run `bun infra/stripe-setup.ts` with APP_URL set to the production URL and keep the printed
   STRIPE_WEBHOOK_SECRET.
4. Store STRIPE_WEBHOOK_SECRET on Vercel (production and preview) with `vercel env add`,
   without printing the values.
5. Deploy again and check: a POST without a signature to /api/webhook/stripe answers 400.
6. Fire `stripe trigger checkout.session.completed` and confirm the delivery in `stripe events list`.
7. Do not try to enable Connect: on an unclaimed sandbox it fails with
   "Only Stripe Connect platforms can work with other accounts". Tell me to claim the sandbox
   (`vercel integration resource claim askedly-stripe`) and to enable Connect in the dashboard.
Do not use live keys and do not create real charges.
```

**What each tool covers:**

| Task | CLI | MCP |
| --- | --- | --- |
| Provision the sandbox and inject the key | `vercel integration add stripe --name askedly-stripe --no-claim` | none |
| Create and list webhooks | `stripe webhook_endpoints create`, or `bun infra/stripe-setup.ts` | `stripe` server |
| Fire and inspect events | `stripe trigger`, `stripe events list`, `stripe logs tail` | `stripe` server |
| Store variables on Vercel | `vercel env add NAME production` | `vercel` server (`create_project_env`) |
| Claim the sandbox | `vercel integration resource claim askedly-stripe` (opens the browser; by you) | none |
| Enable Connect, accept terms | none (`stripe tools enable_connect` fails on an unclaimed sandbox) | none: dashboard, by you |

**Rules for the agent:** a restricted key or the sandbox key, never a full live secret key; never print or commit secrets; test mode until you ask otherwise; any action in live mode (creating a live webhook, changing a key) needs your confirmation first.

## Going to production

- Repeat steps 2 to 4 with live keys and the production URL, and enable Connect on the live account.
- Check in the dashboard which payment methods are active (Checkout shows whatever is enabled; the code does not pin `payment_method_types`).
- Read the list at <https://docs.stripe.com/get-started/checklist/go-live> and the limits in [`payments-stripe.md`](payments-stripe.md#known-limits).
