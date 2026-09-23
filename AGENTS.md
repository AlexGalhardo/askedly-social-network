# RespondeAê — Guia para Agentes de IA

Rede social de perguntas e respostas (estilo Retrospectiva/NGL) com perguntas pagas via PIX.
Next.js 16 (App Router) + React 19 + Prisma 6/PostgreSQL + NextAuth + AbacatePay + Resend + UploadThing.

## Comandos essenciais

- Package manager: **Bun 1.4.2** (`packageManager` no `package.json`). Use `npm`/`node` só se o Bun não suportar algo.
- `bun install` — instalar dependências
- `bun run dev` — servidor de desenvolvimento (Turbopack)
- `bun run build` / `bun run start` — build e servidor de produção
- `bun run lint` / `bun run format` — Biome (lint e format)
- `bun run prisma:migrate` / `bun run prisma:studio` / `bun run prisma:db:seed` — banco de dados

## Setup local

Veja `setups/` para os 6 scripts prontos (Windows/Unix × SQLite/Postgres/Postgres+Docker).
Infra (Docker/docker-compose) fica em `infra/`.

## Estrutura

- `app/` — rotas App Router (páginas em português: `entrar`, `criar-conta`, `feed`, `minha-conta`, `[slug]` = perfil público) e `app/api/*/route.ts` (API routes)
- `actions/` — Server Actions
- `lib/` — auth, integração PIX, repositórios, serviços, utils
- `hooks/` — hooks React Query por domínio
- `prisma/` — schema, migrations, seed
- `emails/` — templates React Email

## Documentação detalhada (`docs/`)

- [`docs/architecture.md`](docs/architecture.md) — camadas e fluxo de dados
- [`docs/database.md`](docs/database.md) — schema Prisma e estratégia SQLite/dev
- [`docs/auth.md`](docs/auth.md) — NextAuth e sessões
- [`docs/payments-pix.md`](docs/payments-pix.md) — AbacatePay e webhook PIX
- [`docs/email.md`](docs/email.md) — Resend e templates
- [`docs/uploads.md`](docs/uploads.md) — UploadThing
- [`docs/telegram-bot.md`](docs/telegram-bot.md) — logger/bot Telegram
- [`docs/testing.md`](docs/testing.md) — como rodar cada tipo de teste
- [`docs/deployment.md`](docs/deployment.md) — CI/CD e deploy

## Convenções

- Conventional Commits obrigatório (validado por commitlint no `commit-msg`)
- Comentários só para edge cases/decisões não óbvias — nunca comentário redundante
- TypeScript com tipagem forte; evite `any` não justificado
- Antes de considerar algo pronto: `bun run build` + testes relevantes devem passar
