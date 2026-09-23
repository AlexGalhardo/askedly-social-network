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

- [ ] Levantar versão estável exata atual de cada dependência em `"latest"`: `@auth/core`, `@radix-ui/react-dialog`, `@radix-ui/react-radio-group`, `@react-email/components`, `next-auth`
- [ ] Atualizar todas as demais dependências para a última versão estável de produção (sem canary/beta/rc)
- [ ] Rodar `bun install`, `bun run build` e validar que nada quebrou
- [ ] Commit (`chore(deps): pin all dependencies to latest stable versions`)

## Fase 3 — AGENTS.md e CLAUDE.md (raiz)

- [ ] Criar `AGENTS.md` e `CLAUDE.md` idênticos, ≤50 linhas, linkando para `docs/*`
- [ ] Commit (`docs: add AGENTS.md and CLAUDE.md`)

## Fase 4 — docs/ (contexto para agentes de IA)

- [ ] `docs/architecture.md` — visão geral do app, App Router, camadas
- [ ] `docs/database.md` — schema Prisma, migrations, seed, estratégia sqlite dev
- [ ] `docs/auth.md` — NextAuth, fluxo de login/registro
- [ ] `docs/payments-pix.md` — integração AbacatePay, webhook PIX
- [ ] `docs/email.md` — Resend, templates em `emails/`
- [ ] `docs/uploads.md` — UploadThing
- [ ] `docs/telegram-bot.md` — bot de notificações
- [ ] `docs/testing.md` — como rodar cada tipo de teste
- [ ] `docs/deployment.md` — CI/CD, Vercel, envs
- [ ] Commit (`docs: add AI-agent-focused documentation`)

## Fase 5 — setups/

- [ ] `setups/setup-windows-using-sqlite.sh`
- [ ] `setups/setup-windows-using-postgres.sh`
- [ ] `setups/setup-windows-using-postgres-with-docker.sh`
- [ ] `setups/setup-unix-using-sqlite.sh`
- [ ] `setups/setup-unix-using-postgres.sh`
- [ ] `setups/setup-unix-using-postgres-with-docker.sh`
- [ ] Commit (`feat: add setup scripts for windows/unix with sqlite/postgres/docker`)

## Fase 6 — infra/

- [ ] Mover `docker-compose.yaml` para `infra/docker-compose.yaml`, criar `infra/Dockerfile`
- [ ] Atualizar `setup.sh`/scripts que referenciam o compose antigo (ou remover `setup.sh` em favor de `setups/`)
- [ ] Commit (`chore: centralize infra configs under infra/`)

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
