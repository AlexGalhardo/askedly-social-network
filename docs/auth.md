# Authentication

NextAuth v4 (`next-auth`), configured in `lib/auth.ts` and exposed in `app/api/auth/[...nextauth]/route.ts`.

## Providers

- **Google OAuth** (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`): on the first login, the user is created automatically with a nickname derived from the email (`generateUniqueNickname`).
- **Credentials** (email/password): in production, when the captcha is enabled, it requires a Cloudflare Turnstile token validated against Cloudflare's API before the password is checked (see [Captcha](#captcha-cloudflare-turnstile)).

## Session

- **JWT** strategy (`session.strategy = "jwt"`), expires in 30 days.
- **Revocation**: at sign-in the token stores `users.session_version`; on every read the `jwt` callback compares it with the database (`assertSessionIsCurrent`). Password change and reset bump the version, so every earlier token stops being valid, including the one on the device that made the change (which goes to `/login?password-changed=1`; the query parameter name was kept from before the routes were renamed). We do not reissue the token for that device on purpose: a stolen token could do the same.
- The `session` callback reads only the fields of the user's own account (`getUserForSession`, no `include`). Reactivating a soft-deleted account and writing `last_login_at` happen only at sign-in.
- **Questions, followers and blocks are not in the session**: each page fetches what it uses through an action (`actions/my-account-actions.ts`), via `useSessionBoundList` (lists) or `useMySocialGraph` (who I follow/blocked/blocked me).
- Extended typing: `Session` in `declare module "next-auth"` and the token in `declare module "next-auth/jwt"`, in `lib/auth.ts` itself.

## Password change

`updatePassword` (`actions/user-actions.ts`) calls `changePassword` (`lib/services/password.service.ts`), which requires the current password: a stolen session is not enough to take over the account. Accounts created through Google have no password; for them the same page sets the first password without asking for the current one. The UI decides which form to show by `session.user.has_password`, a boolean (the hash never enters the session).

## Session verification on the client

`hooks/use-session-verification.ts` + `app/api/auth/verify-session/route.ts` poll/validate the active session on the client (e.g. detecting a logout in another tab, a ban).

## Captcha (Cloudflare Turnstile)

The captcha is an optional feature. It is on only when **both** `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` and `CLOUDFLARE_TURNSTILE_SECRET` are set (`lib/turnstile.ts`, `lib/captcha.ts`):

- without the site key, `TurnstileWidget` renders nothing and the forms (`login`, `signup`, `contact`) do not require a token;
- without either key, `isCaptchaValid` returns `true` and the server does not require a token;
- with both keys, the server checks the token and **fails closed**: no token, or an error talking to Cloudflare, means the request is refused.

On the server, login, signup and the contact form only call `isCaptchaValid` when `NODE_ENV === "production"` (a production build, including `next start` locally), so `next dev` never asks for a captcha. The build warns when the feature is off (`[env] Captcha (Cloudflare Turnstile) is off ...`) or half configured. Keep both keys in production: without them login, signup and contact are protected by the rate limit alone.

Earlier, the server read `CLOUDFLARE_TURNSTILE_SECRET_KEY` (a variable that did not exist) and the client depended on a `NEXT_PUBLIC_NODE_ENV` that was never set, so every password login failed in production.

## Errors and logging

Authentication failures (captcha, credentials, callbacks) are reported through `TelegramLog.error` (see [`telegram-bot.md`](telegram-bot.md)), never exposed in detail to the end user.
