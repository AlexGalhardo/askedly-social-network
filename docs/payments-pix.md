# PIX payments (AbacatePay)

> PIX is the rail in Brazilian reais. The US dollar rail (credits through Stripe, with automatic payout) is in [`payments-stripe.md`](payments-stripe.md). The balance and withdrawal pages described here only consider questions with `currency = "BRL"`.

On this rail a question is paid by PIX through the [AbacatePay](https://abacatepay.com) gateway. There is no free question: a PIX question (`currency = "BRL"`) carries a `webhook_id` (unique) pointing to a confirmed `WebhookAbacatePay`. The column is optional in the schema only because questions paid with credits have none.

## Flow (API v2, `https://api.abacatepay.com/v2`, transparent checkout)

HTTP client in `lib/abacatepay.ts` (server-only); rules in `lib/services/pix-charge.service.ts`.

1. **Create the charge**: `POST /api/pix/create` (requires login) calls `POST /transparents/create` with `method: "PIX"` and stores the charge in `WebhookAbacatePay` with status `PENDING`, **the amount returned by AbacatePay** and the `userId` of whoever is going to pay. It returns `brCode` (copy and paste) and `brCodeBase64` (QR code).
2. **Wait for the payment**: `GET /api/pix/check` (only the owner of the charge) queries `GET /transparents/check`. In v2 it returns only `id`, `status` and `expiresAt`, without the amount, which is why the amount is stored in step 1.
3. **Webhook**: AbacatePay calls `POST /api/webhook/abacatepay?webhookSecret=...` on the `transparent.completed` event. The route validates the secret in the URL **and** the HMAC-SHA256 signature in the `X-Webhook-Signature` header over the raw body (public key documented by AbacatePay). It marks the charge as `PAID` idempotently: retries of the same event are not reprocessed. Other events get a 200 and are ignored.
4. **Create the question**: `createPaidQuestion` requires a `PAID` charge **belonging to the user**. If the webhook has not arrived yet, it confirms on the spot through `check`, which removes the race between the modal's polling and the webhook. The question's amount is the charge's; one PIX is only good for one question.
5. **Simulation** (`NEXT_PUBLIC_TEST_MODE=true` + sandbox key `abc_dev_...`): the modal calls `POST /api/pix/simulate-payment`, which uses `POST /transparents/simulate-payment`. Outside test mode, and always when `VERCEL_ENV=production`, it returns 404.

### Configuring the webhook in the AbacatePay dashboard

- URL: `https://<domain>/api/webhook/abacatepay?webhookSecret=<ABACATEPAY_WEBHOOK_SECRET>`
- Event: `transparent.completed`
- Create one webhook in **Dev mode** for the sandbox key and another in **Production** for the real key.

## Withdrawals

`processWithdraw` (`actions/payment-actions.ts`) calls `withdrawBalance()` (`lib/services/withdraw.service.ts`) with the id **from the session**. The server checks that the questions belong to the user, computes the amount (`calculatePayout`: 50% up to R$ 5.00, 70% above, rounded up) and pays the registered `pix_key`, all in a transaction that prevents withdrawing the same question twice. None of this comes from the client. Model: `PaymentWithdraw`.

## Environment variables

- `ABACATEPAY_API_KEY` and `ABACATEPAY_WEBHOOK_SECRET`: **server-only**, read only in `lib/abacatepay.ts`. Locally, AbacatePay's dev key; on Vercel, the production one. PIX is an optional feature: without both variables the build only warns (`lib/env.ts`).
- `NEXT_PUBLIC_TEST_MODE` (public flag, not a secret) and `DANGER_MODE`.

Never use `NEXT_PUBLIC_` for a secret: Next embeds those values in the JavaScript sent to the browser. Until the fix, the API key was `NEXT_PUBLIC_*` and was imported by a client component, so it was exposed in the public bundle. **The production key must be rotated** in the AbacatePay dashboard.
