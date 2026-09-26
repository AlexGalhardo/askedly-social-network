# RespondeAê — Guia para Agentes de IA

Rede social de perguntas e respostas (estilo Retrospectiva/NGL) com perguntas pagas via PIX.
Next.js 16 (App Router) + React 19 + Prisma 7/PostgreSQL + NextAuth + AbacatePay + Resend + UploadThing.

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
- [`docs/security.md`](docs/security.md) — auditoria OWASP Top 10:2025, riscos aceitos

## Skills (uso obrigatório)

Skills de terceiros vendorizadas em `.claude/skills/` (origem/commit em `.claude/skills/SOURCES.md`), mais agentes em `.claude/agents/` e checklists em `.claude/references/`. **Toda sessão/agente deve usá-las na refatoração** (plano em `PLAN.md`):

- Antes de qualquer tarefa: `using-agent-skills` para escolher a skill; `graphify` para mapear o código (CLI `graphifyy==0.9.68`) em vez de grep cego
- Código: `ponytail` (solução mínima, YAGNI), `code-simplification`, `incremental-implementation`, `test-driven-development`, `debugging-and-error-recovery`
- Revisão: `code-review-and-quality`, `ponytail-review`/`ponytail-audit`, `security-and-hardening` (OWASP), `performance-optimization`
- UI: `impeccable`, `frontend-design`, `frontend-ui-engineering`, `ui-ux-pro-max`, `web-design-guidelines`, `vercel-react-best-practices`
- Processo: `git-workflow-and-versioning`, `ci-cd-and-automation`, `documentation-and-adrs`, `planning-and-task-breakdown`
- Do projeto: `respondeae-secure-endpoint` (toda action/rota/dado que vai ao browser) e `respondeae-local-verification` (validar como o CI antes de dar como pronto)

## Convenções

- Formatação: `.editorconfig` (tab, largura 4, LF) é a fonte da verdade; Biome lê via `formatter.useEditorconfig`. YAML e `package.json` usam espaços
- Conventional Commits obrigatório (validado por commitlint no `commit-msg`)
- Comentários só para edge cases/decisões não óbvias — nunca comentário redundante
- TypeScript com tipagem forte; evite `any` não justificado
- Segurança: quem age vem de `getSessionUser()` (`lib/session.ts`), nunca do body; `"use server"` só em `actions/` (em `lib/` vira endpoint público); nenhuma linha inteira de `User` vai para o browser; valores de dinheiro são calculados no servidor; segredo nunca é `NEXT_PUBLIC_*`. Detalhes em [`docs/architecture.md`](docs/architecture.md)
- Prisma 7: rode `bun run prisma:generate` após `bun install`; use só a instância de `@/prisma/prisma-client`
- Antes de considerar algo pronto: `bun run lint:ci`, `bunx tsc --noEmit`, `bun run build` e os testes relevantes devem passar (o CI bloqueia em todos)

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
