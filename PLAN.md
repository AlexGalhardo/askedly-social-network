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
- **Skills obrigatórias:** toda fase deste plano deve ser executada usando as skills de `.claude/skills/` (lista e quando usar cada uma em `CLAUDE.md`/`AGENTS.md`, origem em `.claude/skills/SOURCES.md`).
- **Formatação:** `.editorconfig` na raiz (tab, largura 4, LF) é a fonte da verdade; `biome.json` usa `formatter.useEditorconfig: true` e repete os mesmos valores. Exceções: YAML (spec proíbe tab) e `package.json` (Bun reescreve com 2 espaços).

---

## Fase 0 — Housekeeping git

- [x] Commit da remoção dos 8 arquivos antigos de `docs/` (`docs: remove outdated documentation`)
- [x] Commit de `.claude/skills/` e primeira versão do plano, hoje `PLAN.md` (`chore: add claude skills and refactor plan`)

## Fase 1 — Bun/tooling baseline

- [x] Adicionar `"packageManager": "bun@1.4.2"` e `engines.bun` no `package.json`
- [x] Remover `package-lock.json` duplicado (mantido só `bun.lock`)
- [x] Corrigir `biome.json` (schema desatualizado quebrava o hook `pre-commit`) e habilitar `css.parser.tailwindDirectives` para `globals.css` formatar sem erro
- [x] `.nvmrc`/`.bun-version`: decidido não criar — `packageManager`/`engines.bun` no `package.json` já fixam o Bun e o CI usa `bun-version: 1.4.2` explícito
- [x] Script `husky` renomeado para `prepare` (convenção Husky v9, roda hooks automaticamente após `bun install`)

## Fase 2 — Upgrade de dependências

- [x] Levantar versão estável exata atual de cada dependência em `"latest"`: `@auth/core`, `@radix-ui/react-dialog`, `@radix-ui/react-radio-group`, `@react-email/components`, `next-auth`
- [x] Atualizar todas as demais dependências para a última versão estável de produção dentro da major atual (sem canary/beta/rc)
- [x] Rodar `bun install`, `bun run build` (com Postgres descartável via Docker) e validar que nada quebrou
- [x] Commit (`chore(deps): pin all dependencies to exact latest stable versions`)

### Upgrades major (aplicados com aval do usuário)

- [x] Prisma 6 → 7.10.0 (driver adapters, `prisma.config.ts`, client gerado em `prisma/generated/`, instância única). SQLite local usa `@prisma/adapter-libsql` porque `better-sqlite3` não roda no Bun.
- [x] `@react-email/components` 0.0.41 → 1.0.12 (os dois templates renderizam igual).
- [x] `framer-motion`: removido em vez de atualizado. Só girava um ícone que já tinha `animate-spin`.
- [x] TypeScript mantido na 6.x (6.0.3, a mais recente) por decisão do usuário.
- [x] SQLite nativo do Bun (`bun:sqlite`): **descartado por inviabilidade técnica**. `bun:sqlite` só existe no runtime Bun, e o Next precisa rodar em Node (a Vercel roda Node, e sob Bun os módulos externalizados pelo Turbopack nem resolvem — ver `docs/deployment.md`). Além disso o único adapter Prisma é comunitário, de um mantenedor só. O SQLite local segue com `@prisma/adapter-libsql`, que funciona em Node e Bun

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
- [x] `docs/testing.md` — atualizado com o estado real (tipos, modos local/CI do e2e, captcha)
- [x] `docs/deployment.md` — atualizado com o estado real (todos os gates bloqueantes, e2e em produção, Node nos testes)
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
- [x] Scripts executados de ponta a ponta num worktree limpo (sem `.env`, como um contribuidor novo): os 3 Windows no Git Bash e `unix-sqlite`/`unix-postgres` num container `oven/bun:1.4.2`. O `unix-postgres-with-docker` difere do Windows só nas mensagens de instalação

## Fase 6 — infra/

- [x] Mover `docker-compose.yaml` para `infra/docker-compose.yaml` (pinado em `postgres:17-alpine`, com healthcheck), criar `infra/Dockerfile`
- [x] Remover `setup.sh` (substituído por `setups/`)
- [x] Commit (`chore: centralize infra configs under infra/`)

## Fase 7 — SemVer + Conventional Commits

- [x] Adicionar `"version": "1.0.0"` ao `package.json` (feito na Fase 1)
- [x] Criar `CHANGELOG.md` (Keep a Changelog + SemVer)
- [x] Adicionar commitlint (`@commitlint/cli` + `@commitlint/config-conventional`, pinados exatos) + `.husky/commit-msg`
- [x] Testado: mensagem válida passa, mensagem inválida é rejeitada (`bunx commitlint`)
- [x] Commit (`chore: adopt semver and conventional commits`)

## Fase 8 — Testes

- [x] Testes unitários/funcionais com `bun:test` (48 testes: `lib/date-time.ts`, `lib/utils.ts`, `lib/utils/*.ts`). `hooks/` e `actions/` ainda sem cobertura — dependem de mocks de React Query/Next que não valiam o esforço nesta rodada; considerar no Fase 11.
- [x] Testes de integração (`tests/integration/users-repository.test.ts`, contra Postgres real descartável)
- [x] Smoke tests (`tests/smoke/health.test.ts` — sobe `next start` de verdade, checa `/api/health` e `/`)
- [x] E2E com Playwright (`tests/e2e/homepage.spec.ts`, `tests/e2e/signup.spec.ts`; fluxo de pagamento PIX/responder pergunta ficou de fora por tempo — considerar expandir depois)
- [x] Scripts `test`, `test:unit`, `test:integration`, `test:smoke`, `test:e2e` no `package.json`
- [x] Commits por tipo de teste
- [x] `tests/e2e/signup.spec.ts` reativado (o `test.fixme` saiu com a correção do Zod na Fase 11)

### 🐛 Bugs críticos encontrados escrevendo os testes (corrigidos na Fase 11)

- **`app/layout.tsx` renderiza `{children}` duas vezes** (`lg:hidden` + `hidden lg:block`) — duplica toda página no DOM (IDs duplicados, hooks/efeitos/chamadas de API em dobro). Afeta TODAS as páginas. Ver `CHANGELOG.md`.
- **`ZodError.errors` não existe na versão do Zod instalada** (é `.issues`) — quebra o tratamento de erro de validação em `handleSignup` (`app/criar-conta/criar-conta.tsx`) e provavelmente em todo formulário/rota que usa esse padrão (ver lista de erros de `bunx tsc --noEmit`: `app/api/send-contact-email`, `app/api/user/delete-account`, `app/api/user/update-password`, `app/api/user/update-personal-info`, `app/api/user/update-social-medias`, `app/contato/contato.tsx`).

## Fase 9 — Husky

- [x] `pre-commit`: `bun run format` + `bunx lint-staged` (biome `--write`, sem `--unsafe`, só nos arquivos staged — evita travar todo commit nos ~31 erros de lint pré-existentes)
- [x] `commit-msg`: validar Conventional Commits via commitlint (feito na Fase 7)
- [x] `pre-push`: `bun run test` (unit) + `bun run build`
- [x] Instalado pacote `lint-staged` de verdade (config já existia no `package.json` mas nada rodava ela) e corrigida a flag do Biome (`--apply` não existe mais no Biome 2.x, agora `--write`)
- [x] Testado rodando um commit real com o novo hook
- [x] Commit (`chore: update husky hooks for staged linting and pre-push tests`)

## Fase 10 — CI/CD GitHub Actions

- [x] Workflow `ci.yml`: lint, format, typecheck, `bun audit`, unit, integração (Postgres service), build + smoke — `lint`/`typecheck`/`security-audit` não bloqueantes até a Fase 11 pagar a dívida
- [x] Workflow `e2e.yml`: Playwright (reporter HTML só em `CI=true`, publicado como artifact em falha)
- [x] Workflow `deploy.yml`: deploy Vercel via `workflow_run` só depois do CI verde em `main`; CLI `vercel@59.26.0` pinado no workflow em vez de devDependency (removia 16 das 26 vulnerabilidades do `bun audit`)
- [x] Validado: `actionlint` limpo + todos os passos rodados localmente com Postgres descartável (format, 48 unit, 6 integração, build, smoke, e2e 2 passed/1 fixme)
- [x] Commit (`ci: add github actions for lint, test, build and deploy`)
- [~] Depende de você: criar o environment `production` no GitHub com `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`, e decidir entre este `deploy.yml` ou a integração Git da Vercel (os dois juntos = deploy duplicado). Ver `docs/deployment.md`.

## Fase 11 — Revisão de lógica, segurança e qualidade (concluída; ver `CHANGELOG.md`)

Executada com as skills `graphify` (mapa do código), `security-and-hardening`, `test-driven-development`, `debugging-and-error-recovery`, `ponytail`, `code-simplification` e `git-workflow-and-versioning`.

- [x] Bugs críticos: layout renderizando páginas 2×; `ZodError.errors` (Zod 4); redirect concorrente no cadastro; e2e de cadastro reativado
- [x] Controle de acesso (OWASP A01): saque, criação/resposta/exclusão/recusa/report/like/expiração de pergunta, seguir, aceitar/rejeitar seguidor, dados de pagamento. Identidade sempre via `lib/session.ts`
- [x] Integridade de dinheiro: valor da pergunta vem do webhook; repasse calculado no servidor; saque e expiração atômicos (testes de integração, inclusive concorrência)
- [x] Segredos: chave e webhook da AbacatePay server-only (confirmado com build + sentinela no bundle); `simulate-payment` só em modo teste; cron com `CRON_SECRET`; Turnstile consertado
- [x] `bun audit` 26 → 1 (a restante está ignorada com justificativa no CI); jobs `lint`, `typecheck` e `security-audit` bloqueantes
- [x] `tsc` 0 erros e `ignoreBuildErrors` removido; lint 0 erros em todo o código
- [x] Código morto: 30 componentes shadcn, 28 dependências, actions/rotas/arquivos sem uso; comentários redundantes removidos
- [x] Toasts de 5 telas que nunca apareciam (store duplicado)

### Pendências que dependem de decisão do usuário

- [x] **Troca de senha sem pedir a senha atual** (A07): senha atual obrigatória; contas Google definem a primeira senha (`lib/services/password.service.ts`)
- [x] **Rate limit** em login/cadastro/contato: feito em Postgres (tabela `rate_limits`, upsert atômico, testado com concorrência) em vez de Upstash, para não depender de serviço pago novo. Login por IP e por email; cadastro, contato e reset por IP; troca de senha por usuário. Validado contra servidor real (NextAuth e rotas)
- [x] **Funcionalidades quebradas**: "reportar resposta" implementado (`lib/services/question-report.service.ts`, com teste); "sacar perguntas não respondidas" removido — não tinha tela, só um hook sem uso chamando rota inexistente. De quebra: o report de pergunta não checava o dono (corrigido)
- [ ] **Vercel**: a conta conectada (time "Fitness Projects") não tem projeto do RespondeAê; falta decidir conta/projeto e configurar `VERCEL_*`, `ABACATEPAY_*`, `CRON_SECRET`, `CLOUDFLARE_TURNSTILE_SECRET`, `DATABASE_URL` de produção. **Rotacionar a chave da AbacatePay**, que ficou exposta

### Pendências técnicas menores

- [x] Seed não roda no SQLite (`createMany({ skipDuplicates })`): `skipDuplicates` só fora do SQLite (validado nos dois bancos)
- [x] Erro de hidratação no botão de tema (`Moon`/`Sun` dependem do tema, que só é conhecido no client)
- [x] Páginas que têm `<main>` próprio dentro do `<main>` do layout (landmark duplicado, a11y): 13 páginas agora usam `<div>`
- [x] Campo de nickname aceita só `a-z`, mas o schema aceita dígitos e `_`: alinhar
- [x] O callback `session` do NextAuth carrega o usuário com todas as perguntas a cada leitura de sessão (performance): não grava mais `last_login_at` nem reativa conta a cada leitura (só no sign-in), e usuários relacionados vêm só com campos públicos (`publicUserSelect`). Tirar as relações da sessão de vez exige migrar ~10 telas para buscar por action; fica como melhoria futura
- [x] 61 warnings do Biome: zerados, e `lint:ci` agora usa `--error-on-warnings`

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

## Fase 14 — [FINAL] Auditoria de segurança OWASP Top Ten (aplicação inteira)

> Última fase, depois de todas as outras. Diferente da Fase 11 (que revisa lógica pontualmente), aqui é uma passada completa e sistemática na aplicação como um todo.

- [ ] Ler a versão vigente em <https://owasp.org/projects/top-ten> (não confiar em lista memorizada — categorias mudam entre edições) e montar checklist por categoria
- [ ] Rodar `graphify` no repo para mapear superfícies de ataque: API routes (`app/api/*`), Server Actions (`actions/`), webhook PIX, auth (NextAuth), uploads (UploadThing), cron (`/api/cronjob`), variáveis `NEXT_PUBLIC_*`
- [ ] Verificar cada categoria contra cada superfície usando as skills `security-and-hardening` (+ `.claude/references/security-checklist.md`) e o agente `.claude/agents/security-auditor.md`
- [ ] Registrar achados em `docs/security.md` (categoria OWASP, arquivo, severidade, correção) e linkar em `AGENTS.md`/`CLAUDE.md`
- [ ] Corrigir achados críticos/altos (1 commit por correção, com teste que prova a correção); médios/baixos viram itens no plano
- [ ] `bun audit` sem vulnerabilidades altas/críticas; CI `security-audit` bloqueante

### Achados antecipados (encontrados antes da auditoria formal)

- [x] **Crítico:** repositórios com `"use server"` (endpoints públicos: dump de usuários, troca de senha de qualquer conta, webhook forjado). Corrigido + teste de guarda
- [x] **Crítico:** linhas inteiras de `User` serializadas para o browser (feed, top curtidas, perfil, sessão) e autor de pergunta anônima revelado. Corrigido
- [x] **Crítico:** chave da Resend hardcoded em `app/api/send-contact-email/route.ts` (bloqueava o push pelo Push Protection do GitHub). Removida do código e do histórico local; chave antiga revogada na Resend pelo usuário
- [ ] **Alto:** `getUserByNicknameAction` (perfil) e `/top-curtidas` ainda devolvem as respostas de perfil privado, respostas privadas e perguntas pendentes para o client filtrar. Filtrar no servidor, como o feed já faz (`lib/services/feed.service.ts`)
- [x] **Médio:** cadastro sem captcha no servidor: mitigado pelo rate limit por IP (5 cadastros/hora). Captcha no servidor exigiria um segundo token para o `signIn` logo depois (o token é de uso único); fica como melhoria opcional
- [ ] **Médio:** as consultas públicas de perguntas ainda devolvem campos internos da pergunta (`webhook_id`, `payment_withdraw_id`, motivo de report). Trocar `include` por `select` explícito
- [ ] Commit (`docs: add OWASP Top Ten security audit report`)
