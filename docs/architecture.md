# Arquitetura

Next.js 16 App Router, deploy na Vercel. Sem client-side state manager global além do React Query — sessão via NextAuth, estado de servidor via React Query.

## Camadas

```text
app/                → rotas (páginas + app/api/*/route.ts) e componentes de página
actions/            → Server Actions chamadas pelos componentes client
hooks/              → hooks React Query (useQuery/useMutation) por domínio, chamam actions/ ou fetch nas API routes
lib/repositories/   → acesso direto ao Prisma (uma função por operação de dados)
lib/services/       → regras de negócio que orquestram repositórios (ex: follow-service, image-upload.service)
lib/utils/          → funções puras (formatação, validação)
prisma/             → schema, migrations, seed (dados fake via @faker-js/faker)
```

Fluxo típico de escrita: componente → hook (`hooks/`) → Server Action (`actions/`) ou API route (`app/api/`) → service/repository (`lib/`) → Prisma → Postgres.

## Domínios principais

- **Usuários**: cadastro, login (Google OAuth + credenciais), perfil público em `app/[slug]`, privacidade granular (campos `privacy_*` no model `User`).
- **Perguntas**: uma pergunta só existe após pagamento PIX confirmado (`Question.webhook_id` é obrigatório e único, ligado a `WebhookAbacatePay`). Ver [`payments-pix.md`](payments-pix.md).
- **Seguidores**: relação `Follower` (segue direto) e `FollowRequest` (perfis privados pedem aprovação).
- **Bloqueios**: `UserBlock`, checado antes de permitir pergunta/visualização de perfil.

## Convenções de nomenclatura

- Rotas e componentes de página em português (`entrar`, `criar-conta`, `minha-conta`), código interno (variáveis, funções, tipos) em inglês.
- `lib/interfaces.ts` e `types/` concentram os tipos compartilhados entre camadas.
