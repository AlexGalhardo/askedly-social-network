# Stripe payments (credits and Connect)

Second payment method, alongside PIX ([`payments-pix.md`](payments-pix.md)). PIX is in Brazilian reais and the withdrawal is manual; Stripe is in US dollars and the payout is automatic.

| | PIX (AbacatePay) | Credits (Stripe) |
| --- | --- | --- |
| Currency (`questions.currency`) | `BRL` | `USD` |
| The asker pays | one PIX per question | with credits bought beforehand by card |
| The answerer receives | a balance withdrawn to the PIX key, at `/payments` | a Stripe transfer to the connected account, on answering |
| Declined, expired or reported | a refund the asker can withdraw | the full credits back to the asker |
| Platform fee | `calculatePayout` (`lib/services/withdraw.service.ts`) | the same function |

## Flow

1. **Buy credits.** `POST /api/stripe/checkout` (`{ amount }` in cents, from US$ 5 to US$ 1,000) creates a Checkout hosted by Stripe and stores `stripe_purchases` as `pending`. 1 credit = 1 US cent.
2. **Webhook** `POST /api/webhook/stripe` checks the signature (`STRIPE_WEBHOOK_SECRET`) over the raw body and, on `checkout.session.completed` or `checkout.session.async_payment_succeeded` with a `payment_status` other than `unpaid`, calls `fulfillCreditsPurchase`: it marks the purchase `completed` and adds to `users.credits_cents` in the same transaction. Repeated events find the purchase already completed and do not credit again. `checkout.session.expired` and `async_payment_failed` mark it `expired`.
3. **Ask with credits.** `POST /api/question/create-with-credits` calls `createCreditQuestion`: the debit is an `updateMany` conditional on the balance, in the same transaction that creates the question (`currency: "USD"`, no `webhook_id`). Amount from US$ 2 to US$ 1,000, validated on the server.
4. **Settle.** When the question leaves the queue (answered, declined, expired or reported), the route calls `settleCreditQuestion` (`lib/services/stripe-connect.service.ts`):
   - answered: transfers `calculatePayout(amount_paid)` to the owner's connected account and stores `stripe_transfer_id`;
   - declined, expired or reported: returns the full `amount_paid` to the asker's credits.

   `questions.amount_already_withdraw` marks the settlement, so the function can run several times. If the owner does not have an eligible account yet, or the platform has no available balance, nothing changes and the daily cron (`settlePendingCreditQuestions`, in `/api/cronjob`) tries again. The cron also expires overdue credit questions.

## Stripe Connect

- **Model:** marketplace with "separate charges and transfers". The credit purchase lands in full on the platform's account; the payout happens later, through `transfers.create`, and the platform fee is the difference that is not transferred. `application_fee_amount` does not apply to this model.
- **Connected account:** Accounts v2 (`stripe.v2.core.accounts.create`), `recipient` configuration with the `stripe_balance.stripe_transfers` capability, `dashboard: "express"`, `fees_collector` and `losses_collector` set to `application`. Created once per user in `POST /api/stripe/connect` (`{ country }`), which returns the onboarding link hosted by Stripe.
- **Before transferring** the code checks `configuration.recipient.capabilities.stripe_balance.stripe_transfers.status === "active"`.
- **Never transfer twice:** the transfer uses `transfer_group: question_<id>` and an idempotency key; before creating it, the code looks for an existing transfer in the group (covers a crash between Stripe answering and the database write).
- `GET /api/stripe/connect` returns `{ credits, payoutStatus }` for the session user (`none`, `pending` or `active`).
- **The Stripe account must be a Connect platform.** On an account or sandbox where Connect is not enabled, creating a connected account fails, so payouts do not work until Connect is turned on in the dashboard. See [`stripe-setup.md`](stripe-setup.md).

## Environment variables

| Variable | Use |
| --- | --- |
| `STRIPE_SECRET_KEY` | Server-only. Prefer a restricted key (`rk_`) with write access to Checkout Sessions, Transfers and Connect |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the `/api/webhook/stripe` endpoint |
| `PAYMENTS_SIMULATED` | `true` turns on demo mode, without calling any gateway. Ignored in production on Vercel. See [`docker.md`](docker.md) |

There is no publishable key: the app only redirects to pages hosted by Stripe, with no Stripe.js, so the CSP does not change. The Vercel Marketplace integration also injects a publishable key and MCP keys; the app does not use them.

Stripe is an optional feature: without both variables the build only warns (`lib/env.ts`).

Account and webhook configuration: [`stripe-setup.md`](stripe-setup.md).

## Known limits

- **Available balance.** A card payment takes days to leave "pending". With low volume, the transfer can fail for insufficient balance; the cron retries the next day. In test mode, the card `4000 0000 0000 0077` credits the available balance immediately.
- **Refund and dispute of a credit purchase** (`charge.refunded`, `charge.dispute.created`) are not handled: the credits stay with the user. Reverse them manually in `users.credits_cents` until this exists.
- **Credits do not turn back into money for the buyer.** They only come back as credit.
- **Taxes:** `automatic_tax` is not turned on.

## Tests

`tests/integration/stripe-credits.test.ts` proves, against a real Postgres and without calling Stripe: a repeated or concurrent webhook credits once; simultaneous questions do not spend the same credit; an amount below the minimum and an insufficient balance do not debit; a decline returns the credits once; an answer transfers the amount minus the fee once.
