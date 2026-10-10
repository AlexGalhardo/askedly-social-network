# Security — OWASP Top 10:2025 audit

Audit of the whole application against the current edition, **OWASP Top 10:2025** (read at <https://top10.owasp.org/2025>, not from memory). It was phase 14 of the earlier `PLAN.md` (the plan has since been rewritten in four phases). The rules that apply to all new code are in [`architecture.md`](architecture.md#security-rules-mandatory).

## Attack surfaces

Mapped with `graphify` (graph in `graphify-out/`) and checked one by one:

| Surface | Count | How it authenticates |
| --- | --- | --- |
| API routes (`app/api/**/route.ts`) | 35 | `getSessionUser()`/`getServerSession`; public by design: `health`, `send-contact-email`, `reset-password/*` (token), `cronjob` (`CRON_SECRET`), `webhook/abacatepay` (secret + HMAC), NextAuth, UploadThing (session in the middleware) |
| Server Actions (`actions/*.ts`) | 20 exports | every action is a public endpoint; identity always from the session |
| PIX webhook | 1 | secret in the URL + HMAC-SHA256 of the raw body with constant-time comparison; idempotent |
| Cron | 1 | `Authorization: Bearer $CRON_SECRET` |
| Uploads | 1 | session in the UploadThing middleware, image up to 4 MB, 1 file |
| `NEXT_PUBLIC_*` | 3 | `APP_URL`, `CLOUDFLARE_TURNSTILE_SITE_KEY`, `TEST_MODE`: none is a secret |

## Result per category

| Category | Status | Findings fixed in this phase (commit) |
| --- | --- | --- |
| **A01 Broken Access Control** | ✅ | Repositories with `"use server"` exposed as endpoints (user dump, password change of any account, forged webhook) — `56297c2`; `followUserAction` accepted the id of the follower — `cbea9bc`; question report without checking the owner — `0ea71b6`; profile, feed and ranking delivering content from restricted profiles, private answers and pending questions — `7c12399`, `49fa2bf` |
| **A02 Security Misconfiguration** | ✅ | No security headers — `331b67e`; strict nonce-based CSP — `f3e9d5e`; `simulate-payment` depended only on `NEXT_PUBLIC_TEST_MODE` — `aea020d` |
| **A03 Software Supply Chain Failures** | ✅ | `bun audit --audit-level=high` with no findings (1 ignored with a justification: `deepmerge-ts`, only in the Prisma CLI); blocking gate in CI; dependencies pinned to exact versions |
| **A04 Cryptographic Failures** | ✅ | Reset token stored in plain text — now only the SHA-256 (`ee06fbc`); passwords with bcrypt cost 12; secrets out of the bundle |
| **A05 Injection** | ✅ | No finding: the only raw SQL is a parameterized template (`rate-limit.service.ts`); no `dangerouslySetInnerHTML`; inputs validated with Zod |
| **A06 Insecure Design** | ✅ | Password reset sent the link to a fixed email of the owner, without validating the new password and with a token reusable in a race — `ee06fbc`; whole private data serialized to the browser — `56af2f5` |
| **A07 Authentication Failures** | ✅ | Sessions were not revoked on password change — `0a44341`; signup without captcha on the server — `99218de`; no rate limit — `5e7c045`; the limit itself allowed locking the victim's login — `cb828ec`; account enumeration through response time — `7b7b6d2`; password change without the current password — `174c2dc`; login captcha failed open — `5e7c045` |
| **A08 Software or Data Integrity Failures** | ✅ | No new finding: webhook with HMAC and idempotency; the question's amount comes from the confirmed payment (phase 11) |
| **A09 Security Logging and Alerting Failures** | ✅ | Nobody was warned of brute force — Telegram alert on the first violation of each window, masked email (`6cf13a5`); the contact form stopped logging the body |
| **A10 Mishandling of Exceptional Conditions** | ✅ | Internal `error.message` (Prisma, network) returned to the client in ~15 places — `9821d16`; captcha failing open on a network error — `5e7c045` |

Every fix has a test that proves the behavior (`tests/integration/*`, `lib/**/*.test.ts`, `tests/e2e/profile.spec.ts`). The phase 11 fixes (withdrawal, question price, question/follow routes, AbacatePay secrets, cron) are in `CHANGELOG.md`.

## Improvements made after the audit

| Item | How |
| --- | --- |
| Sessions revoked on password change/reset | `users.session_version` goes up on every change; the `jwt` callback compares on every read and, if it changed, NextAuth discards the session and deletes the cookie (`lib/services/session-revocation.service.ts`). Proven by an e2e with two browsers |
| Complete CSP | `proxy.ts` generates one nonce per request; `script-src 'nonce-…' 'strict-dynamic'`, with no `unsafe-inline`/`unsafe-eval` for scripts in production; external origins listed in `lib/csp.ts`. `tests/e2e/csp.spec.ts` fails on any violation |
| Captcha on the server at signup too | the action validates the token before touching the database; the login that follows asks for a fresh token (`waitForFreshTurnstileToken`) |
| Session without relations | the session carries only the user's own account; questions, followers and blocks come through an action on each page (`actions/my-account-actions.ts`) |

## Accepted risks and next steps

| Severity | Item | Why it stayed this way |
| --- | --- | --- |
| Low | Login by email locks for 15 min after 10 failures (even with the right password) | Classic trade-off against brute force. With the current order, locking someone's account requires solving 10 captchas per window |
| Low | The "user without a password" message reveals that the email belongs to a Google account | UX decision: it guides the user to sign in with Google |
| Low | `pix/check` answers the status of any `pix_id` to any logged-in user | It only returns status/expiry and the id is random (not enumerable) |
| Low | Webhook URL secret compared with `!==` | The HMAC signature, verified in constant time right after, is the control that counts |
| Info | The profile page only shows questions to the owner and followers (the flag `privacy_show_questions_answered_only_to_followers` never changed anything) | Existing behavior, kept. Product decision recorded in `PLAN.md` |

## Stripe, credits and admin panel (added after the audit)

New surfaces and the control for each one. Flow in [`payments-stripe.md`](payments-stripe.md).

| Surface | Control |
| --- | --- |
| `POST /api/webhook/stripe` | Stripe signature checked over the raw body; without `STRIPE_WEBHOOK_SECRET` it refuses everything. Idempotent crediting in a transaction (`fulfillCreditsPurchase`), amount read from the purchase stored on the server, never from the event |
| `POST /api/stripe/checkout` | Session required, amount validated on the server (US$ 5 to US$ 1,000), rate limit per user |
| `POST /api/question/create-with-credits` | Author from the session; amount validated in the service; debit conditional on the balance in the same transaction as the question (no double spending) |
| `POST /api/stripe/connect` | The connected account is always the session user's; the id never comes from the body. Created once (`updateMany` conditional on `stripe_account_id: null`) |
| Payout (`settleCreditQuestion`) | Amount by `calculatePayout` on the server; `transfer_group` + idempotency key + lookup of an existing transfer prevent a double payout; credit refund in a transaction with a settlement mark |
| `/admin` | `is_admin` checked in the database with the session id; a non-admin gets a 404. Read only, only aggregates and nicknames |
| `PAYMENTS_SIMULATED` | Gives away free money by design; ignored when `VERCEL_ENV=production` |

New accepted risks:

| Severity | Risk | Why it was accepted |
| --- | --- | --- |
| Medium | A refund or dispute of a credit purchase does not take the credits back | No handling of `charge.refunded`/`charge.dispute.created` yet; manual reversal. Recorded in `PLAN.md` |
| Medium | Stolen card: buy credits, ask a question to an account you own and receive the payout | Stripe Radar is the first barrier; the platform is liable for a negative balance (`losses_collector: application`). Anti-fraud limits are in `PLAN.md` |
| Low | `PAYMENTS_SIMULATED=true` on a production host outside Vercel would release payments with no money | The variable only exists in the demo compose file; documented in `docker.md` |

### Captcha as an optional feature

Turnstile is on only when **both** keys exist (`NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` and `CLOUDFLARE_TURNSTILE_SECRET`). Without either of them the widget does not show up and the server does not require a token (`lib/turnstile.ts`, `lib/captcha.ts`); with both, it keeps failing closed. Consequence: a deployment without the keys has no captcha on login, signup and contact, protected by the rate limit alone. The build warns (`[env] Captcha ... is off`). In production, keep both keys.

### Environment validation, routes and error pages

- `lib/env.ts` (Zod), called from `next.config.ts`, fails the build when an essential variable is missing and warns about optional features that are off or half configured, so a misconfigured deployment is noticed at build time. It also warns when `NEXT_PUBLIC_TEST_MODE` is `true` in production. `SKIP_ENV_VALIDATION=true` exists only for the Docker image build.
- The old Portuguese routes 301-redirect in `proxy.ts`. Because the public profile lives at `/<nickname>`, a nickname equal to a route (current or old) is rejected at signup (`RESERVED_NICKNAMES` in `lib/schemas/signup.ts`): nobody can register a profile that shadows or impersonates a route such as `/admin` or `/login`.
- `app/error.tsx` and `app/global-error.tsx` show a translated error page instead of the raw 500; internal error details still never reach the client (`publicErrorMessage`).

## How to maintain it

- Run `bun audit` (CI already blocks) and the integration tests, which cover the access controls for money, reset and profile.
- Every new action/route follows the rules in [`architecture.md`](architecture.md#security-rules-mandatory): identity from the session, no whole `User` row to the browser, rate limit on an abusable endpoint, captcha failing closed.
- `lib/repositories/public-surface.test.ts` fails if `"use server"` comes back to `lib/`.
