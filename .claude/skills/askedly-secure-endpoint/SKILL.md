---
name: askedly-secure-endpoint
description: >
  Askedly Social Network checklist for creating or changing a Server Action (actions/), an API route (app/api/) or any
  function that returns data to the browser. Use it whenever you write "use server", a route.ts, a query that feeds
  a public page, or touch login/signup/password/payment. Based on the real findings of the audit in
  docs/security.md.
---

# Secure endpoint in Askedly Social Network

Every Server Action is a public HTTP endpoint, callable by anyone with any arguments. Everything an action
returns, everything a Server Component passes to a Client Component, and the NextAuth session go to the browser.
The most serious bugs in the project came from forgetting these two sentences.

## Before writing

1. `"use server"` only in files under `actions/`. Never in `lib/` (the test `lib/repositories/public-surface.test.ts` breaks).
2. The business rule goes into a service in `lib/services/` (testable without Next); the action/route only authenticates and calls it.

## Checklist

- [ ] **Identity from the session**: `getSessionUser()` (`lib/session.ts`). No `userId`, `followerId`, `nickname` or
      owner coming from the body/argument identifies who is acting. Real example: `followUserAction(followingId, followerId)`
      let anyone make anyone follow anyone.
- [ ] **Per-object authorization**: the ownership condition goes into the `updateMany`/`where` itself (check and write in a
      single statement, no race). See `question-report.service.ts`, `withdraw.service.ts`.
- [ ] **No whole `User` row leaving**: `select` with `publicUserSelect`/`publicQuestionInclude`; public questions
      go through `toPublicQuestion` (removes the anonymous author, internal fields, hidden amount); the profile through
      `toPublicProfile`. Filter privacy **on the server**, never "the client hides it".
- [ ] **Money computed on the server** (amount from the paid webhook, `calculatePayout`), never from the client.
- [ ] **Validation with Zod** on the server, even if the client already validates. Passwords use the rules in `lib/schemas/signup.ts`.
- [ ] **Rate limit** on anything abusable (login, signup, email, password): `consumeRateLimit` + `RATE_LIMITS`
      (`lib/services/rate-limit.service.ts`), IP through `lib/request-ip.ts`. A limit that counts only failures (login by
      email) uses `isRateLimited` + consuming on failure, so the victim's account cannot be locked.
- [ ] **Captcha fails closed**: `isCaptchaValid` (`lib/captcha.ts`). The captcha is an optional feature, on only when both
      `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` and `CLOUDFLARE_TURNSTILE_SECRET` are set; do not add your own
      "skip the captcha" branch, call `isCaptchaValid` and let it decide.
- [ ] **Error for the user**: `publicErrorMessage(error, "generic text")` (`lib/errors.ts`), never the raw
      `error.message`. The detail goes to `TelegramLog.error`. User-facing text is a translation key (`messages/en`,
      `pt`, `es`), never hardcoded.
- [ ] **Account data does not go into the NextAuth session**: a service in `lib/services/my-account.service.ts` + an action in
      `actions/my-account-actions.ts`, consumed by `useSessionBoundList`/`useMySocialGraph`.
- [ ] **New external service** (script, API called from the browser, iframe): add the origin in `lib/csp.ts` and run
      `tests/e2e/csp.spec.ts` in production mode, otherwise the CSP blocks it silently.
- [ ] **A secret never in `NEXT_PUBLIC_*`** and never hardcoded (GitHub Push Protection blocks the push). A new
      variable is registered in `lib/env.ts` (essential or optional feature) and in `.env.example`.
- [ ] **New top-level page route**: add its name to `RESERVED_NICKNAMES` in `lib/schemas/signup.ts`, because the
      public profile lives at `/<nickname>` and a nickname equal to a route would shadow it.
- [ ] **A test that proves the control**: integration in `tests/integration/` (e.g. "another user cannot do it"), with a
      disposable Postgres.

## Afterwards

Update `docs/security.md` if the endpoint creates a new surface or accepts a risk.
