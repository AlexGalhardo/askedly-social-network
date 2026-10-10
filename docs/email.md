# Email

Sent through [Resend](https://resend.com) (`RESEND_API_KEY`). Templates in React Email (`@react-email/components`), in the `emails/` folder. Emails are an optional feature: without `RESEND_API_KEY` the build only warns (`lib/env.ts`).

## Existing templates

- `emails/contact-email.tsx` — used by `app/api/send-contact-email/route.ts` (contact form, `app/contact`)
- `emails/reset-password-email.tsx` — used by the password recovery flow (`app/api/reset-password/*`)

## Password recovery flow

1. `POST /api/reset-password/request` — generates `reset_password_token` (with an expiry) on the `User` and sends the email with the link.
2. `POST /api/reset-password/verify` — validates the token before showing the new password form.
3. `POST /api/reset-password/reset` — changes the password (hash through `bcryptjs`) and invalidates the token.

## Adding a new template

Create a component in `emails/`, render it with `@react-email/components` and call `resend.emails.send(...)` in the corresponding route handler. Do not reuse templates across different flows — each transactional email has its own file. Email texts are translated like the rest of the interface (`emails` namespace, see [`i18n.md`](i18n.md)).
