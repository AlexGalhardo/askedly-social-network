# E-mail

Envio via [Resend](https://resend.com) (`RESEND_API_KEY`). Templates em React Email (`@react-email/components`), pasta `emails/`.

## Templates existentes

- `emails/contact-email.tsx` — usado por `app/api/send-contact-email/route.ts` (formulário de contato, `app/contato`)
- `emails/reset-password-email.tsx` — usado pelo fluxo de recuperação de senha (`app/api/reset-password/*`)

## Fluxo de recuperação de senha

1. `POST /api/reset-password/request` — gera `reset_password_token` (com expiração) no `User` e dispara o e-mail com o link.
2. `POST /api/reset-password/verify` — valida o token antes de mostrar o formulário de nova senha.
3. `POST /api/reset-password/reset` — troca a senha (hash via `bcryptjs`) e invalida o token.

## Adicionando um novo template

Criar componente em `emails/`, renderizar com `@react-email/components` e chamar `resend.emails.send(...)` no route handler correspondente. Não reaproveitar templates entre fluxos diferentes — cada e-mail transacional tem seu próprio arquivo.
