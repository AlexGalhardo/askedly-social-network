# PLANO — Refatoração RespondeAê para padrão Open Source

> Plano vivo. Cada sessão futura deve ler este arquivo antes de continuar.
> Legenda: `[ ]` não iniciado · `[~]` parcial/depende de ação do dev · `[x]` concluído.
> Regra: 1 tarefa concluída = 1 microcommit (Conventional Commits).

## Decisões já travadas (não perguntar de novo)

- **Package manager:** Bun 1.4.2 como padrão; comandos alternativos em npm/node só onde Bun não suportar.
- **SQLite:** `prisma/schema.prisma` (Postgres) continua sendo o schema de produção. Um `prisma/schema.sqlite.prisma` espelhado é mantido só para os scripts `setup-*-sqlite.sh` (dev local sem Docker). Precisa ser atualizado manualmente sempre que `schema.prisma` mudar — documentar isso em `docs/database.md`.
- **Test runner:** `bun:test` para unit/funcional/integração/smoke. Playwright só para e2e.
- **docs/:** os 8 arquivos antigos (já deletados no working tree, não commitados) NÃO serão restaurados — docs/ recomeça do zero, focada em dar contexto para agentes de IA.
- **Ritmo de execução:** autonomia total nas fases de baixo risco (commit por tarefa). Parar para revisão do usuário antes de: (a) qualquer refatoração de lógica/arquitetura que mude comportamento (Fase 12), (b) bumps de versão *major* que possam quebrar build.
- **Deploy alvo do CI/CD:** Vercel (evidência: `vercel.json` + `@vercel/speed-insights` já em uso). Ajustar se o usuário corrigir.

---

## Fase 0 — Housekeeping git

- [x] Commit da remoção dos 8 arquivos antigos de `docs/` (`docs: remove outdated documentation`)
- [x] Commit de `.claude/skills/` e primeira versão do `TODO.md` (`chore: add claude skills and refactor plan`)

## Fase 1 — Bun/tooling baseline

- [x] Adicionar `"packageManager": "bun@1.4.2"` e `engines.bun` no `package.json`
- [x] Remover `package-lock.json` duplicado (mantido só `bun.lock`)
- [x] Corrigir `biome.json` (schema desatualizado quebrava o hook `pre-commit`) e habilitar `css.parser.tailwindDirectives` para `globals.css` formatar sem erro
- [~] `.nvmrc`/`.bun-version`: não criado — `engines.bun` no `package.json` já expressa o requisito; adicionar só se surgir necessidade real (ex: CI que dependa de arquivo de versão)
- [x] Script `husky` renomeado para `prepare` (convenção Husky v9, roda hooks automaticamente após `bun install`)

## Fase 2 — Upgrade de dependências

- [x] Levantar versão estável exata atual de cada dependência em `"latest"`: `@auth/core`, `@radix-ui/react-dialog`, `@radix-ui/react-radio-group`, `@react-email/components`, `next-auth`
- [x] Atualizar todas as demais dependências para a última versão estável de produção dentro da major atual (sem canary/beta/rc)
- [x] Rodar `bun install`, `bun run build` (com Postgres descartável via Docker) e validar que nada quebrou
- [x] Commit (`chore(deps): pin all dependencies to exact latest stable versions`)

### ⚠️ Upgrades major pendentes (requerem seu aval antes de aplicar — risco real de quebra)

- **`@prisma/client` / `prisma`**: atual `6.19.3`. `@prisma/client` tem major estável `7.10.0` disponível; já o CLI `prisma` aponta "latest" para `8.0.0-rc.15` (release candidate — **não deve ser usado** pela sua regra de nunca usar pre-release). Migrar exigiria revisar o guia oficial de major upgrade do Prisma e provavelmente adotar `prisma.config.ts` (o `package.json#prisma.seed` já está deprecated a partir do Prisma 7).
- **`@react-email/components`**: atual `0.0.41` (pré-1.0). Major estável `1.0.12` disponível — API pode ter mudado significativamente vindo de uma versão 0.0.x.
- **`framer-motion`**: atual `12.43.0` (já atualizado dentro da v12). Major `13.4.2` disponível.
- **`typescript`**: atual `6.0.3`. Major `7.0.2` disponível — impacto potencial em todo o typecheck do projeto.

Decisão: pausar aqui e perguntar ao usuário se quer que eu tente esses 4 upgrades agora (um de cada vez, com build+testes validando cada um) ou se ficam para depois.

## Fase 3 — AGENTS.md e CLAUDE.md (raiz)

- [x] Criar `AGENTS.md` e `CLAUDE.md` idênticos, ≤50 linhas, linkando para `docs/*`
- [x] Commit (`docs: add AGENTS.md and CLAUDE.md`)

## Fase 4 — docs/ (contexto para agentes de IA)

- [x] `docs/architecture.md` — visão geral do app, App Router, camadas
- [x] `docs/database.md` — schema Prisma, migrations, seed, estratégia sqlite dev
- [x] `docs/auth.md` — NextAuth, fluxo de login/registro
- [x] `docs/payments-pix.md` — integração AbacatePay, webhook PIX (achado: API keys `NEXT_PUBLIC_*` expostas no client — revisar na Fase 11 OWASP)
- [x] `docs/email.md` — Resend, templates em `emails/`
- [x] `docs/uploads.md` — UploadThing
- [x] `docs/telegram-bot.md` — bot de notificações
- [~] `docs/testing.md` — escrito como "estado alvo", precisa ser atualizado quando a Fase 8 for implementada de verdade
- [~] `docs/deployment.md` — escrito como "estado alvo", precisa ser atualizado quando a Fase 10 (CI/CD) for implementada de verdade
- [x] Commit (`docs: add AI-agent-focused documentation`)

## Fase 5 — setups/

- [x] `setups/setup-windows-using-sqlite.sh`
- [x] `setups/setup-windows-using-postgres.sh`
- [x] `setups/setup-windows-using-postgres-with-docker.sh`
- [x] `setups/setup-unix-using-sqlite.sh`
- [x] `setups/setup-unix-using-postgres.sh`
- [x] `setups/setup-unix-using-postgres-with-docker.sh`
- [x] `prisma/schema.sqlite.prisma` criado e validado (`prisma validate` + `prisma db push` contra sqlite descartável)
- [x] Commit (`feat: add setup scripts for windows/unix with sqlite/postgres/docker`)
- [~] Scripts postgres/postgres+docker não foram executados de ponta a ponta neste ambiente (só `bash -n` sintático) — Docker local já tinha um Postgres de outro projeto ocupando a porta 5432; validar na próxima sessão com ambiente limpo

## Fase 6 — infra/

- [x] Mover `docker-compose.yaml` para `infra/docker-compose.yaml` (pinado em `postgres:17-alpine`, com healthcheck), criar `infra/Dockerfile`
- [x] Remover `setup.sh` (substituído por `setups/`)
- [x] Commit (`chore: centralize infra configs under infra/`)

## Fase 7 — SemVer + Conventional Commits

- [ ] Adicionar `"version": "1.0.0"` ao `package.json`
- [ ] Criar `CHANGELOG.md` (Keep a Changelog + SemVer)
- [ ] Adicionar commitlint (`@commitlint/cli` + `@commitlint/config-conventional`)
- [ ] Commit (`chore: adopt semver and conventional commits`)

## Fase 8 — Testes

- [ ] Testes unitários/funcionais com `bun:test` (lib/, hooks/, actions/)
- [ ] Testes de integração (rotas de API, Prisma contra DB de teste)
- [ ] Smoke tests (build sobe, `/api/health` responde)
- [ ] E2E com Playwright (fluxos: login, criar pergunta, responder, pagamento PIX mock)
- [ ] Scripts `test`, `test:unit`, `test:integration`, `test:smoke`, `test:e2e` no `package.json`
- [ ] Commit(s) por tipo de teste

## Fase 9 — Husky

- [ ] `pre-commit`: lint + format
- [ ] `commit-msg`: validar Conventional Commits via commitlint
- [ ] `pre-push`: rodar testes + build
- [ ] Commit (`chore: update husky hooks for conventional commits and tests`)

## Fase 10 — CI/CD GitHub Actions

- [ ] Workflow `ci.yml`: lint, testes, build em PRs
- [ ] Workflow `e2e.yml`: Playwright
- [ ] Workflow `deploy.yml`: deploy Vercel em push para `main`
- [ ] Commit (`ci: add github actions for lint, test, build and deploy`)

## Fase 11 — [CHECKPOINT: parar e pedir revisão do usuário antes de iniciar]

- [ ] Revisão de lógica de negócio (OWASP Top 10 2025, clean architecture, DRY/KISS)
- [ ] Remover comentários redundantes, manter só os que explicam edge cases/decisões
- [ ] Aplicar design patterns onde fizer sentido, sem over-engineering

## Fase 12 — README.md final

- [ ] Nome do app centralizado
- [ ] Badges/status (build, licença, versão)
- [ ] Introdução em português
- [ ] Tech stack
- [ ] Links para `setups/*`
- [ ] Links para `docs/*`
- [ ] Créditos + licença MIT
- [ ] Commit (`docs: rewrite README following open source standard`)

## Fase 13 — Skills novas (.claude/skills/)

- [ ] Avaliar necessidade de skills específicas do projeto (ex: "como rodar migrations", "como adicionar novo endpoint de pagamento") conforme forem surgindo durante as fases acima
