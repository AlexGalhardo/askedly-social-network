# Architecture

Next.js 16 App Router, deployed on Vercel. No global client-side state manager besides React Query — session through NextAuth, server state through React Query.

## Layers

```text
app/                → routes (pages + app/api/*/route.ts), page components, error pages (error.tsx, global-error.tsx)
actions/            → Server Actions called by the client components
components/         → shared components; components/ui/ holds the Base UI wrappers
hooks/              → React Query hooks (useQuery/useMutation) per domain, calling actions/ or fetching the API routes
proxy.ts            → per-request CSP nonce and 301 redirects from the old Portuguese routes
lib/session.ts      → getSessionUser(): identity of the user making the request (single source of "who is acting")
lib/env.ts          → environment variable validation (Zod), called from next.config.ts
lib/abacatepay.ts   → AbacatePay secrets, server only
lib/stripe.ts       → Stripe client, server only
lib/payment-simulation.ts → demo mode (PAYMENTS_SIMULATED), ignored in production on Vercel
i18n/ + messages/   → next-intl: language by cookie/browser and texts in en, pt, es (see i18n.md)
lib/repositories/   → direct Prisma access (one function per data operation)
lib/services/       → business rules, especially the ones that move money (withdraw, question-create, question-expiry, credits, stripe-connect, admin)
lib/utils/          → pure functions (formatting, validation)
prisma/             → schema, migrations, seed (fake data through @faker-js/faker)
```

Typical write flow: component → hook (`hooks/`) → Server Action (`actions/`) or API route (`app/api/`) → service/repository (`lib/`) → Prisma → Postgres.

## Security rules (mandatory)

- **Identity comes from the session, never from the request.** Every API route or Server Action that acts on someone's behalf calls `getSessionUser()` and answers 401 without a session. A `nickname`, `userId` or `followerId` coming from the body/arguments never identifies who is acting: Server Actions are public endpoints.
- **Money values are computed on the server**, from the paid webhook (`amount_paid`) and from `calculatePayout`. Never accept an amount, PIX key or owner coming from the client.
- **State changes involving money** (withdrawal, expiry, question creation) live in `lib/services/`, use a conditional update/transaction so there is no race, and have an integration test in `tests/integration/`.
- **`"use server"` only in `actions/`.** The directive turns *every export* of the file into a public endpoint, callable by anyone with any arguments. Repositories and services in `lib/` never use it (`lib/repositories/public-surface.test.ts` fails if someone adds it). A client component that needs data calls a thin action in `actions/` that checks the session and calls the service.
- **No whole `User` row going to the browser.** Everything a Server Action returns, everything a Server Component passes to a Client Component and everything in the NextAuth session is serialized to the client. Public queries use `select` with public fields only (`publicQuestionInclude` in `questions.repository.ts`); data with nested includes goes through `stripPrivateFields`/`toPublicProfile` (`lib/services/profile.service.ts`). An anonymous question leaves with `asked_by: null` (`hideAnonymousAsker`).
- **An endpoint that can be abused has a rate limit** (`consumeRateLimit` + `RATE_LIMITS` in `lib/services/rate-limit.service.ts`, IP through `lib/request-ip.ts`). In-memory does not work: each serverless instance would have its own counter.
- **New external script/service → `lib/csp.ts`.** The CSP is strict (nonce + `'strict-dynamic'`); an origin not listed in `connect-src`/`frame-src` is blocked silently. Run `tests/e2e/csp.spec.ts` afterwards.
- **Account data does not go into the session.** A new list for the logged-in user = a service in `lib/services/my-account.service.ts` + an action in `actions/my-account-actions.ts`.
- **Captcha is optional and fails closed** (`lib/captcha.ts`). Cloudflare Turnstile is on only when both `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` and `CLOUDFLARE_TURNSTILE_SECRET` are set; once on, an error talking to Cloudflare = request refused.
- **A secret never uses `NEXT_PUBLIC_`**: Next embeds those variables in the public bundle.
- A Server Action that calls an API route through `fetch` must forward the cookie (`forwardedHeaders()` in `actions/sent-question-actions.ts`); ideally it calls the service directly.

## Main domains

- **Users**: signup, login (Google OAuth + credentials), public profile in `app/[slug]`, granular privacy (`privacy_*` fields on the `User` model).
- **Questions**: a question only exists after payment. On the PIX rail, after a confirmed PIX charge (`Question.webhook_id`, unique, linked to `WebhookAbacatePay`); on the credits rail, after a debit of the asker's credits in the same transaction (no `webhook_id`). See [`payments-pix.md`](payments-pix.md) and [`payments-stripe.md`](payments-stripe.md).
- **Followers**: `Follower` relation (direct follow) and `FollowRequest` (private profiles require approval).
- **Blocks**: `UserBlock`, checked before allowing a question/profile view.

## Routes

- Routes are in English: `/login`, `/signup`, `/forgot-password`, `/change-password`, `/my-account`, `/payments`, `/sent-questions`, `/received-questions`, `/privacy-policy`, `/terms-of-use`, `/followers`, `/following`, `/about`, `/contact`, `/top-liked`, plus `/feed`, `/admin` and the public profile at `/[slug]`.
- The old Portuguese paths (`/entrar`, `/criar-conta`, `/minha-conta`, ...) 301-redirect to the new ones in `proxy.ts` (`legacyRoutes`), so old links and search engines keep working.
- The public profile lives at `/<nickname>`, so a nickname equal to a route (current or old) would be unreachable: `RESERVED_NICKNAMES` in `lib/schemas/signup.ts` rejects them at signup. Routes with a hyphen are not in the list because a nickname does not accept hyphens. Add any new top-level route to that list.
- Errors render `app/error.tsx` (inside the layout) and `app/global-error.tsx` (when the root layout itself fails), both translated, instead of the raw 500.

## UI

- **Base UI** (`@base-ui/react`), not shadcn/Radix. The wrappers live in `components/ui/` (button, dialog, select, tabs, ...).
- Composition uses the `render` prop instead of `asChild`: `<Button render={<Link href="/" />}>`.
- State selectors are Base UI data attributes: `data-[checked]`, `data-[active]`, `data-[open]`, `data-[disabled]` (not `data-[state=...]`).
- **Tailwind 4 is CSS-first**: design tokens live in the `@theme inline` block of `app/globals.css`, and plugins come in through `@plugin`. There is no `tailwind.config.ts` and no `components.json`.
- **Brand**: the UI shows "Askedly" (logo in `components/askedly-logo.tsx`, favicon in `app/icon.svg`). "Askedly Social Network" is the repository/project name.

## Environment variables

`lib/env.ts` validates the environment with Zod and is called from `next.config.ts`, so it runs on every build and every start. Essential variables (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`) fail the build when missing or invalid. Optional features (PIX, Stripe, captcha, Google login, emails, avatar upload, Telegram logs, daily cron) only warn (`[env] ...`) and stay off; a half-configured feature is also reported. `SKIP_ENV_VALIDATION=true` skips the check and exists only for the Docker image build, which receives the variables at runtime.

## Naming and language conventions

- Code, comments, documentation and commit messages are in English, and so are the routes.
- The interface is translated through next-intl (English by default, Portuguese and Spanish); user content is never translated. See [`i18n.md`](i18n.md).
- `lib/interfaces.ts` and `types/` hold the types shared between layers.
