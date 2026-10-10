# PLANO — Askedly Social Network

> Plano vivo. Cada sessão deve ler este arquivo antes de continuar.
> Legenda: `[ ]` não iniciado · `[~]` parcial ou depende de ação do dono das credenciais · `[x]` concluído.
> Regra: 1 tarefa concluída = 1 commit (Conventional Commits), com teste e doc quando couber.

Rede social global de perguntas e respostas pagas. Cada pessoa tem um perfil público; quem pergunta paga (PIX em reais ou créditos em dólar via Stripe), quem responde recebe a maior parte, e a plataforma fica com a taxa.

O projeto é construído em quatro fases. Cada fase só começa com o critério de saída da anterior cumprido.

| Fase | Versão | Objetivo |
| --- | --- | --- |
| 1. ESTRUTURA | `0.1.0` | Repositório, ferramentas, banco e CI prontos, sem funcionalidade de produto |
| 2. ALPHA | `0.5.0` | Produto funcionando de ponta a ponta para o time, com pagamentos simulados |
| 3. BETA | `0.9.0` | Pagamentos reais, segurança auditada, três idiomas, produção para usuários convidados |
| 4. 1.0.0 STABLE | `1.0.0` | Aberto ao público, open source, operável por qualquer pessoa com a documentação |

## Decisões travadas (não perguntar de novo)

- **Stack:** Next.js 16 (App Router) + React 19 + TypeScript estrito, Prisma 7 + PostgreSQL, NextAuth, Tailwind 4 + Base UI, TanStack Query.
- **Gerenciador:** Bun (pacotes, scripts, testes). O Next roda em Node em produção, smoke e e2e (a Vercel roda Node).
- **Dependências:** última versão estável, versão exata, sem `rc`/`beta`. Dependência nova precisa de justificativa.
- **Banco:** `prisma/schema.prisma` (Postgres) é o schema de produção, com migrations versionadas. `prisma/schema.sqlite.prisma` é um espelho mantido à mão, só para dev local sem Docker.
- **Pagamentos:** dois trilhos independentes. PIX (AbacatePay) em BRL com saque manual; créditos (Stripe) em USD com repasse automático por Connect. `questions.currency` separa os dois. Valores sempre em centavos inteiros, calculados no servidor.
- **Taxa da plataforma:** quem responde fica com 50% de perguntas até 5,00 e 70% acima (`calculatePayout`), nos dois trilhos.
- **Idiomas:** inglês (padrão), português e espanhol, sem prefixo na URL. Só a interface é traduzida; conteúdo de usuário não.
- **Segurança:** todo endpoint é público; quem age vem da sessão; nenhuma linha inteira de `User` vai ao browser; segredo nunca é `NEXT_PUBLIC_*`.
- **Testes:** `bun:test` para unidade, integração (Postgres real e descartável, sem mock) e smoke; Playwright para e2e.
- **Deploy:** Vercel pela integração Git (`main` = produção, PR = preview). CI no GitHub Actions bloqueia em lint, tipos, auditoria, testes e build.
- **Formatação:** `.editorconfig` (tab, largura 4, LF) é a fonte da verdade; Biome para código, markdownlint para Markdown.
- **Skills:** toda tarefa usa as skills de `.claude/skills/` (lista em `CLAUDE.md`).

---

## Fase 1 — ESTRUTURA (`0.1.0`)

Objetivo: qualquer pessoa clona, roda um comando e tem o ambiente de pé, com o CI verde, antes de existir produto.

### Repositório e ferramentas

- [x] Repositório `askedly-social-network`, licença MIT (`LICENSE.md`), `.editorconfig`, `.gitignore`, `.dockerignore`
- [x] Bun fixado em `packageManager`/`engines`; todas as dependências em versão exata
- [x] TypeScript estrito, sem `ignoreBuildErrors`
- [x] Biome (lint + format) lendo o `.editorconfig`; `lint:ci` falha com warning
- [x] markdownlint (`bun run lint:md`) em `*.md`, `docs/` e `.github/`
- [x] Husky: `pre-commit` (format + lint-staged), `commit-msg` (commitlint), `pre-push` (testes + build)
- [x] Conventional Commits + SemVer + `CHANGELOG.md` (Keep a Changelog)

### Aplicação base

- [x] Next.js App Router com layout, tema claro/escuro e navegação lateral
- [x] Camadas definidas: `app/` (rotas), `actions/` (Server Actions), `lib/services` (regra de negócio), `lib/repositories`, `hooks/`
- [x] Headers de segurança e CSP estrito por nonce (`proxy.ts`, `lib/csp.ts`)
- [x] `/api/health`
- [x] Variáveis de ambiente validadas com Zod no build (`lib/env.ts`): essencial faltando derruba o build, opcional só avisa
- [x] Telas de erro (`app/error.tsx`, `app/global-error.tsx`) no lugar do 500 cru

### Banco de dados

- [x] Prisma 7 com driver adapters e instância única (`prisma/prisma-client.ts`)
- [x] Schema inicial e migrations versionadas; espelho SQLite para dev local
- [x] Seed modular (`prisma/seed-orchestrator.ts`): usuários do sistema, usuários aleatórios, seguidores, perguntas

### Ambiente local e infraestrutura

- [x] `.env.example` com todas as variáveis comentadas
- [x] Seis scripts em `setups/` (Windows/Unix × SQLite/Postgres/Postgres com Docker)
- [x] `infra/docker-compose.yaml` (Postgres) e `infra/Dockerfile` (imagem `oven/bun` com tag fixa)

### CI/CD

- [x] `ci.yml`: lint, markdown lint, typecheck, auditoria de dependências, testes unitários, integração (Postgres em service container), build + smoke
- [x] `e2e.yml`: Playwright contra build de produção
- [x] Dependabot para `bun` e `github-actions`
- [x] Integração Git da Vercel; `infra/vercel-build.sh` (generate, migrate só em produção, build)

### Documentação para pessoas e agentes

- [x] `README.md`, `AGENTS.md` e `CLAUDE.md` (idênticos, curtos, apontando para `docs/`)
- [x] `docs/architecture.md`, `docs/database.md`, `docs/tooling.md`, `docs/testing.md`, `docs/deployment.md`
- [x] Skills vendorizadas em `.claude/skills/` com origem registrada em `SOURCES.md`

**Critério de saída:** clone limpo + um script de `setups/` + `bun run dev` funciona; CI verde em um PR vazio.

---

## Fase 2 — ALPHA (`0.5.0`)

Objetivo: o produto inteiro funciona para o time, de criar conta a sacar, com pagamentos simulados. Pode ter aresta visual; não pode ter fluxo quebrado.

### Contas

- [x] Cadastro com email e senha, validado no servidor (Zod), com captcha
- [x] Login com credenciais e com Google (NextAuth, sessão JWT)
- [x] Esqueci a senha e reset por email (Resend + React Email)
- [x] Minha Conta: dados pessoais, redes sociais, avatar (UploadThing), senha, excluir conta
- [x] Configurações de privacidade (perfil privado, aceitar anônimas, mostrar valores, curtidas)

### Perfil e rede

- [x] Perfil público em `/[slug]`
- [x] Seguir, deixar de seguir, pedidos para perfil privado, aceitar e rejeitar
- [x] Bloquear e desbloquear
- [x] Listas de seguidores e seguindo

### Perguntas

- [x] Enviar pergunta paga: pública ou anônima, resposta pública ou privada, valor público ou privado
- [x] Limite diário de perguntas (10 públicas, 1 anônima), zerado pelo cron
- [x] Responder, recusar, expirar por prazo, denunciar pergunta, denunciar resposta
- [x] Perguntas recebidas e perguntas enviadas
- [x] Curtir e descurtir respostas
- [x] Feed da comunidade e de quem você segue; ranking das mais curtidas

### Dinheiro (simulado)

- [x] Cobrança PIX com QR code e confirmação por consulta
- [x] Saldo derivado das perguntas respondidas; taxa da plataforma por `calculatePayout`
- [x] Saque para a chave PIX cadastrada, em transação, sem sacar a mesma pergunta duas vezes
- [x] Modo demonstração `PAYMENTS_SIMULATED` (`lib/payment-simulation.ts`)
- [x] Aplicação completa em Docker com seed (`infra/docker-compose.demo.yaml`, `docs/docker.md`)

### Administração

- [x] Conta admin no seed (`admin@gmail.com`) e painel `/admin` com totais por moeda, receita, compras e saques
- [x] Seed de pagamentos de demonstração para o painel (`seed-payments-demo.service.ts`)
- [x] Cron diário protegido por `CRON_SECRET`: limites, contas excluídas, rate limits vencidos

### Testes da fase

- [x] Unitários das funções puras (repasse, privacidade de pergunta, datas, utilitários)
- [x] Integração: criação de pergunta, saque (inclusive concorrente), expiração, denúncia, feed, cadastro, senha
- [x] Smoke: o build sobe e responde

**Critério de saída:** o roteiro de `docs/docker.md` passa inteiro, do cadastro ao saque, sem conta externa.

---

## Fase 3 — BETA (`0.9.0`)

Objetivo: dinheiro de verdade com usuários convidados. Nada que mova dinheiro ou exponha dado pode depender de confiança no cliente.

### Pagamentos reais

- [x] PIX pela AbacatePay v2 com webhook assinado (HMAC sobre o corpo cru) e idempotente
- [x] Créditos em dólar pela Stripe: Checkout hospedado, webhook assinado, crédito idempotente (`docs/payments-stripe.md`)
- [x] Pergunta paga com créditos: débito condicional ao saldo na mesma transação
- [x] Stripe Connect (Accounts v2, conta de recebimento): onboarding hospedado e repasse por transferência ao responder
- [x] Devolução integral dos créditos em pergunta recusada, expirada ou denunciada
- [x] Cron refaz liquidações pendentes e expira perguntas em créditos vencidas
- [x] Script idempotente de configuração da Stripe (`infra/stripe-setup.ts`, `docs/stripe-setup.md`)
- [ ] Tratar reembolso e disputa da compra de créditos (`charge.refunded`, `charge.dispute.created`)
- [ ] Repasse PIX automático (hoje o saque só registra o pedido; o pagamento é manual)
- [ ] Histórico de compras de créditos e de repasses Stripe na tela de Pagamentos

### Segurança

- [x] Auditoria OWASP Top 10:2025 (`docs/security.md`), com achados corrigidos e riscos aceitos registrados
- [x] Identidade sempre da sessão (`getSessionUser`); autorização por objeto dentro do próprio `where`
- [x] Nenhuma linha inteira de `User` no browser; autor de pergunta anônima nunca sai do servidor
- [x] Rate limit em Postgres para login, cadastro, contato, senha e compra de créditos
- [x] Captcha (Turnstile) como recurso opcional: ligado só com as duas chaves, e então falha fechado
- [x] Captcha verificado no servidor; sessões revogadas na troca de senha (`session_version`)
- [x] Teste de guarda: `"use server"` proibido em `lib/`
- [x] `SECURITY.md` com canal privado de reporte
- [x] Guarda contra perguntar para si mesmo com créditos
- [ ] Limites antifraude na compra de créditos (teto diário por conta, bloqueio de conta recém-criada)

### Internacionalização

- [x] next-intl com inglês (padrão), português e espanhol; idioma por cookie ou navegador (`docs/i18n.md`)
- [x] Chaves de tradução checadas pelo `tsc` nos três idiomas
- [x] Interface, erros de API, metadata, textos legais e emails traduzidos
- [x] Dinheiro formatado pela moeda do dado (`BRL` ou `USD`), datas pelo idioma
- [ ] Revisão dos textos legais em inglês e espanhol por pessoa fluente (hoje são tradução do português)
- [ ] E2E em inglês (hoje o Playwright roda só em `pt-BR`)

### Qualidade e operação

- [x] Integração dos créditos: webhook repetido, gasto concorrente, devolução e repasse uma única vez
- [x] E2E: home, login, cadastro, troca de senha, CSP sem violação em modo produção
- [ ] E2E do fluxo de pergunta paga (PIX e créditos) em modo demonstração
- [x] Logs de eventos de negócio e erros no Telegram
- [~] Produção na Vercel validada (`/api/health`, migrations, headers, webhooks e cron recusando sem segredo)

### Ações que só o dono das credenciais pode fazer

- [ ] Rotacionar as chaves do repositório legado `askedly.com` (o `.env.example` de lá tinha valores com cara de reais: Stripe, banco, token do Telegram)
- [ ] Rotacionar a chave da AbacatePay e cadastrar o webhook de produção
- [ ] Criar `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` na Vercel e ativar o Connect (`docs/stripe-setup.md`)
- [ ] Criar `CRON_SECRET` e `RESEND_FROM_EMAIL` na Vercel
- [ ] Conferir `NEXT_PUBLIC_TEST_MODE=false` em produção e remover `NODE_ENV`, `SEED_*`, `DANGER_MODE`
- [ ] Ativar Deployment Checks na Vercel exigindo `CI` e `E2E`

**Critério de saída:** uma pergunta paga de verdade em cada trilho, respondida e repassada em produção; nenhum item de segurança aberto com severidade alta.

---

## Fase 4 — 1.0.0 STABLE (`1.0.0`)

Objetivo: aberto ao público e mantido como projeto open source. Quem chega pela primeira vez consegue rodar, entender, contribuir e fazer o próprio deploy só com o repositório.

### Open source

- [x] `LICENSE.md` (MIT), `CONTRIBUTE.md`, `SECURITY.md`
- [x] `README.md` com o que é, stack, como rodar e mapa da documentação
- [ ] `CODE_OF_CONDUCT.md`
- [ ] Modelos de issue e de pull request em `.github/`
- [ ] README e documentação principal em inglês (hoje em português)

### Documentação completa

- [x] `docs/architecture.md`, `database.md`, `auth.md`, `security.md`, `testing.md`, `tooling.md`
- [x] `docs/payments-pix.md`, `payments-stripe.md`, `stripe-setup.md`
- [x] `docs/i18n.md`, `email.md`, `uploads.md`, `telegram-bot.md`
- [x] `docs/deployment.md`, `vercel-deploy.md` (manual e com agentes de IA), `docker.md`
- [ ] ADRs das decisões grandes (dois trilhos de pagamento, idioma sem prefixo, saldo derivado em vez de ledger)

### Produto

- [ ] Domínio próprio, com `metadataBase`, sitemap e emails apontando para ele (hoje `respondeae.com.br` e `respondeae.vercel.app`)
- [x] Nomes de rota em inglês com redirecionamento 301 das antigas (`proxy.ts`) e nicknames reservados para as rotas
- [ ] Decisão de produto: perfil público deve mostrar respostas a qualquer visitante? (a flag `privacy_show_questions_answered_only_to_followers` hoje não muda a tela)
- [ ] Notificações (pergunta recebida, resposta recebida, repasse feito)
- [ ] Acessibilidade revisada (WCAG AA) e Core Web Vitals medidos em produção

### Confiabilidade

- [ ] Ledger de movimentações (compras, débitos, devoluções, repasses) no lugar de saldos derivados, com conciliação contra a Stripe
- [ ] Monitoramento e alertas (erros, falha de webhook, liquidação pendente há mais de 24 h)
- [ ] Backup e teste de restauração do banco
- [ ] Teste de carga do feed e da criação de pergunta
- [ ] Plano de rollback documentado e ensaiado

### Lançamento

- [ ] Chaves live da Stripe e checklist de go-live da Stripe cumprido
- [ ] Termos de uso e política de privacidade revisados por advogado (LGPD, GDPR)
- [ ] Tag `v1.0.0`, release no GitHub com notas do `CHANGELOG.md`

**Critério de saída:** uma pessoa de fora faz o deploy próprio seguindo só a documentação, e o projeto fica 30 dias em produção sem incidente de pagamento.
