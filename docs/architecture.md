# Arquitetura

Next.js 16 App Router, deploy na Vercel. Sem client-side state manager global além do React Query — sessão via NextAuth, estado de servidor via React Query.

## Camadas

```text
app/                → rotas (páginas + app/api/*/route.ts) e componentes de página
actions/            → Server Actions chamadas pelos componentes client
hooks/              → hooks React Query (useQuery/useMutation) por domínio, chamam actions/ ou fetch nas API routes
lib/session.ts      → getSessionUser(): identidade do usuário da requisição (única fonte de "quem está agindo")
lib/abacatepay.ts   → segredos da AbacatePay, só no servidor
lib/repositories/   → acesso direto ao Prisma (uma função por operação de dados)
lib/services/       → regras de negócio, em especial as que movem dinheiro (withdraw, question-create, question-expiry)
lib/utils/          → funções puras (formatação, validação)
prisma/             → schema, migrations, seed (dados fake via @faker-js/faker)
```

Fluxo típico de escrita: componente → hook (`hooks/`) → Server Action (`actions/`) ou API route (`app/api/`) → service/repository (`lib/`) → Prisma → Postgres.

## Regras de segurança (obrigatórias)

- **Identidade vem da sessão, nunca do request.** Toda API route ou Server Action que age em nome de alguém chama `getSessionUser()` e responde 401 sem sessão. `nickname`, `userId` ou `followerId` vindos do body/argumentos nunca identificam quem age: Server Actions são endpoints públicos.
- **Valores monetários são calculados no servidor**, a partir do webhook pago (`amount_paid`) e de `calculatePayout`. Nunca aceite valor, chave PIX ou dono vindos do client.
- **Mudanças de estado com dinheiro envolvido** (saque, expiração, criação de pergunta) ficam em `lib/services/`, usam update condicional/transação para não ter corrida e têm teste de integração em `tests/integration/`.
- **`"use server"` só em `actions/`.** A diretiva transforma *cada export* do arquivo num endpoint público, chamável por qualquer um com quaisquer argumentos. Repositórios e services em `lib/` nunca a usam (`lib/repositories/public-surface.test.ts` falha se alguém colocar). Componente client que precisa de dado chama uma action fina em `actions/` que confere a sessão e chama o service.
- **Nada de linha inteira de `User` indo para o browser.** Tudo que uma Server Action retorna, que um Server Component passa para um Client Component e o que está na sessão do NextAuth é serializado para o client. Consultas públicas usam `select` só com campos públicos (`publicQuestionInclude` em `questions.repository.ts`); dados com includes aninhados passam por `stripPrivateFields`/`toPublicProfile` (`lib/services/profile.service.ts`). Pergunta anônima sai com `asked_by: null` (`hideAnonymousAsker`).
- **Endpoint que dá para abusar tem rate limit** (`consumeRateLimit` + `RATE_LIMITS` em `lib/services/rate-limit.service.ts`, IP via `lib/request-ip.ts`). Em memória não serve: cada instância serverless teria o seu contador.
- **Script/serviço externo novo → `lib/csp.ts`.** O CSP é estrito (nonce + `'strict-dynamic'`); origem não listada em `connect-src`/`frame-src` é bloqueada em silêncio. Rode `tests/e2e/csp.spec.ts` depois.
- **Dados da conta não vão na sessão.** Lista nova do usuário logado = service em `lib/services/my-account.service.ts` + action em `actions/my-account-actions.ts`.
- **Captcha falha fechado** (`lib/captcha.ts`): erro ao falar com a Cloudflare = requisição recusada.
- **Segredo nunca usa `NEXT_PUBLIC_`**: o Next embute essas variáveis no bundle público.
- Server Action que chama uma API route por `fetch` precisa repassar o cookie (`forwardedHeaders()` em `actions/sent-question-actions.ts`); o ideal é chamar o service direto.

## Domínios principais

- **Usuários**: cadastro, login (Google OAuth + credenciais), perfil público em `app/[slug]`, privacidade granular (campos `privacy_*` no model `User`).
- **Perguntas**: uma pergunta só existe após pagamento PIX confirmado (`Question.webhook_id` é obrigatório e único, ligado a `WebhookAbacatePay`). Ver [`payments-pix.md`](payments-pix.md).
- **Seguidores**: relação `Follower` (segue direto) e `FollowRequest` (perfis privados pedem aprovação).
- **Bloqueios**: `UserBlock`, checado antes de permitir pergunta/visualização de perfil.

## Convenções de nomenclatura

- Rotas e componentes de página em português (`entrar`, `criar-conta`, `minha-conta`), código interno (variáveis, funções, tipos) em inglês.
- `lib/interfaces.ts` e `types/` concentram os tipos compartilhados entre camadas.
