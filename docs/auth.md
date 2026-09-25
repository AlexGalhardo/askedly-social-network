# Autenticação

NextAuth v4 (`next-auth`), configurado em `lib/auth.ts` e exposto em `app/api/auth/[...nextauth]/route.ts`.

## Providers

- **Google OAuth** (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`): no primeiro login, cria o usuário automaticamente com nickname derivado do e-mail (`generateUniqueNickname`).
- **Credentials** (email/senha): em produção exige token do Cloudflare Turnstile (`CLOUDFLARE_TURNSTILE_SECRET`) validado contra a API do Cloudflare antes de checar a senha.

## Sessão

- Estratégia **JWT** (`session.strategy = "jwt"`), expira em 30 dias.
- O callback `jwt`/`session` recarrega o usuário do banco a cada acesso (`getUserByEmail`), reativa contas soft-deleted (`handleDeletedAccount`) e atualiza `last_login_at`.
- `session.user` é enriquecido com todos os campos de perfil, privacidade, seguidores/seguindo e perguntas (com marcação de expiradas via `processExpiredQuestions`).
- Tipagem estendida da sessão declarada via `declare module "next-auth"` no próprio `lib/auth.ts`.

## Troca de senha

`updatePassword` (`actions/user-actions.ts`) chama `changePassword` (`lib/services/password.service.ts`), que exige a senha atual: uma sessão roubada não basta para tomar a conta. Contas criadas pelo Google não têm senha; nelas a mesma tela define a primeira senha sem pedir a atual. A UI decide qual formulário mostrar por `session.user.has_password`, um booleano (o hash nunca entra na sessão).

## Verificação de sessão no cliente

`hooks/use-session-verification.ts` + `app/api/auth/verify-session/route.ts` fazem polling/validação de sessão ativa no client (ex: detectar logout em outra aba, banimento).

## Captcha (Cloudflare Turnstile)

O captcha só é exigido quando `NODE_ENV === "production"`, e essa mesma condição decide, no client (`entrar`, `criar-conta`, `contato`), se o token é enviado. Antes, o servidor lia `CLOUDFLARE_TURNSTILE_SECRET_KEY` (variável que não existia) e o client dependia de um `NEXT_PUBLIC_NODE_ENV` nunca definido, então todo login por senha falhava em produção.

## Erros e logging

Falhas de autenticação (captcha, credenciais, callbacks) são reportadas via `TelegramLog.error` (ver [`telegram-bot.md`](telegram-bot.md)), nunca expostas em detalhe ao usuário final.
