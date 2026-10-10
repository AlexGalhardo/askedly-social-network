# Changelog

Todas as mudanças notáveis deste projeto são documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e o versionamento segue [SemVer](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Security

- **Sessões revogadas na troca/reset de senha**: antes um JWT valia 30 dias de qualquer jeito. Agora `users.session_version` sobe a cada troca e todo token anterior deixa de valer, em todos os aparelhos.
- **CSP estrito por nonce** (`proxy.ts`, `lib/csp.ts`): scripts só com o nonce da requisição. Todas as páginas passaram a ser renderizadas por requisição (exigência do nonce).
- **Captcha verificado no servidor no cadastro** (antes só no browser).
- **Saque**: `POST /api/payments/withdraw` não tinha login e aceitava `userId`, valor e chave PIX do body, permitindo sacar o saldo de qualquer usuário para qualquer chave. Agora o saque usa a sessão, calcula o valor no servidor, paga a chave cadastrada do próprio usuário e roda em transação que impede sacar a mesma pergunta duas vezes. A rota foi removida.
- **Criação de pergunta**: o valor pago vinha do body (pagar R$ 2 e registrar R$ 1.000 inflava saque e reembolso) e o autor também. Agora o valor é o do webhook pago, o autor é o usuário da sessão, e o limite diário é conferido.
- **8 rotas de pergunta/seguir** (responder, apagar, recusar, reportar, curtir, descurtir, expirar, seguir) não checavam sessão e confiavam no `nickname` do body. Agora exigem login e usam a sessão. Expirar pergunta também confere o prazo e o estado no servidor.
- **Chave da AbacatePay exposta**: era `NEXT_PUBLIC_*` e importada por componente client, então ia para o bundle público. Agora é server-only (`ABACATEPAY_API_KEY`, `ABACATEPAY_WEBHOOK_SECRET`). **A chave de produção precisa ser rotacionada.**
- `simulate-payment` só responde em modo de teste; o webhook recusa tudo se o secret não estiver configurado; a página pública `/pix-test` foi removida.
- **Cron** (`/api/cronjob`, que apaga contas antigas) era público. Agora exige `CRON_SECRET`.
- Server Actions de dados de pagamento aceitavam qualquer `nickname`, e as de aceitar/rejeitar seguidor aceitavam qualquer solicitação. Agora são restritas ao usuário da sessão.
- **Repositórios expostos como endpoints públicos** (crítico): `users`, `questions` e `webhooks-abacatepay.repository.ts` tinham `"use server"`, então qualquer pessoa podia chamar direto, sem login, `getAllUsers` (todos os usuários com hash de senha, email, chave PIX e api_key), `updateUserPassword` (trocar a senha de qualquer conta) e `createWebhookAbacatePay` (forjar pagamento). A diretiva saiu; o feed e o cadastro passaram a usar Server Actions próprias (`actions/feed-actions.ts`, `actions/signup-actions.ts`), e o cadastro agora é validado no servidor. Um teste impede `"use server"` em `lib/`.
- **Dados privados de usuários indo para o browser** (crítico): feed, top curtidas, perfil público (`getUserByNicknameAction`) e a sessão do NextAuth serializavam linhas inteiras de `User` (hash de senha, email, chave PIX, api_key), inclusive de quem perguntou e de seguidores. Agora só campos públicos saem do servidor.
- **Autor de pergunta anônima revelado** no feed, no top curtidas, no perfil e na sessão de quem recebeu a pergunta. Agora `asked_by` vem `null` e a tela mostra "Pergunta Anônima". Perguntas anônimas enviadas por alguém não aparecem mais no perfil dessa pessoa para outros visitantes.
- Feed: respostas de perfis privados eram filtradas só no client (chegavam ao browser de qualquer visitante). Agora o filtro é no servidor.
- **Chave da Resend no bundle público**: `app/api/send-contact-email/route.ts` tinha a chave hardcoded como fallback, e a página `/contato` (client) importava esse arquivo para usar o schema, levando a chave para o JavaScript do browser. O schema foi para `lib/schemas/contact.ts` e a chave só vem de `RESEND_API_KEY`. **A chave antiga precisa ser rotacionada.**
- **Troca de senha** (OWASP A07) não pedia a senha atual, então quem tivesse uma sessão aberta tomava a conta. Agora a senha atual é obrigatória; contas criadas pelo Google (sem senha) definem a primeira pela mesma tela. A rota duplicada `app/api/user/update-password`, sem uso, foi removida.
- Hash de senha com bcrypt custo 12 em todos os fluxos (cadastro e reset usavam 10).
- Vulnerabilidades transitivas corrigidas via `overrides` (`effect`, `baseline-browser-mapping`, `mysql2`). `bun audit`: 26 → 1, e essa única, `deepmerge-ts`, só existe no CLI do Prisma e está ignorada com justificativa. O job de auditoria do CI agora bloqueia.
- **Auditoria OWASP Top 10:2025** da aplicação inteira, registrada em `docs/security.md`. Correções:
  - `followUserAction` aceitava o id de quem segue: qualquer usuário fazia qualquer um seguir qualquer um (e furava a solicitação de perfil privado).
  - Reset de senha mandava o link para um email fixo do dono (usuários nunca recebiam, e quem lesse aquela caixa tomava qualquer conta), guardava o token em texto puro, deixava usar o token duas vezes em corrida e aceitava qualquer senha nova. Remetente agora vem de `RESEND_FROM_EMAIL`.
  - O rate limit de login por email contava toda tentativa antes do captcha, o que deixava travar o login da vítima de propósito. Agora conta só falhas depois do captcha, e um login certo zera.
  - Email inexistente respondia em ~3 ms e senha errada em ~260 ms: dava para listar contas. Agora os dois custam um bcrypt.
  - Perfil público, feed e ranking entregavam ao browser respostas de perfis restritos, respostas privadas, perguntas pendentes, bloqueios e pedidos de seguir, campos internos (`webhook_id`, saque, moderação) e o valor pago mesmo quando o dono o escondia. O servidor agora filtra (`toPublicProfile`, `toPublicQuestion`).
  - Mensagens internas de erro (Prisma, rede) deixaram de ir para o client (`publicErrorMessage`).
  - Headers de segurança (nosniff, Referrer-Policy, anti-clickjacking, Permissions-Policy, HSTS).
  - `simulate-payment` nunca roda num deploy de produção, mesmo com `NEXT_PUBLIC_TEST_MODE` ligado por engano.
  - Alerta no Telegram na primeira violação de rate limit de cada janela.
- **Rate limit** em login (por IP e por email), cadastro, contato, pedido de reset de senha (por IP) e troca de senha (por usuário). Janela fixa numa tabela `rate_limits` do próprio Postgres (um upsert atômico por requisição, compartilhado por todas as instâncias serverless; sem serviço externo). O cron diário apaga janelas vencidas.
- **Report de pergunta sem checar o dono**: qualquer usuário logado podia "reportar" a pergunta de outro, o que também a tirava da fila de resposta. Agora só o dono.
- Validação do captcha no login **falhava aberta**: se a Cloudflare não respondesse, o login seguia sem captcha. Agora falha fechada (`lib/captcha.ts`, compartilhado com o contato).
- O formulário de contato não loga mais o corpo da mensagem.
- Server Actions sem uso (`likeAnswer`, `dislikeAnswer`, `withdrawUnanswered`) removidas: toda action é um endpoint público.

### Fixed

- O feed escondia as respostas e perguntas do próprio usuário: a lista de "quem me bloqueou" continha o próprio nickname.
- O card de usuários bloqueados não tinha nome nem avatar.
- A sidebar logava todas as perguntas recebidas no console.
- **Deploy na Vercel**: todo build falhava (`Can't resolve './generated/prisma/client'`), porque o client do Prisma 7 fica fora do git e ninguém o gerava. O script `vercel-build` (`infra/vercel-build.sh`) gera o client, aplica migrations só em produção e builda. Primeiro deploy de produção no ar em `https://respondeae.vercel.app`. O workflow `deploy.yml` saiu: a integração Git da Vercel já faz o deploy.
- Erro de hidratação no botão de tema: o markup dependia do tema, que só existe no client. Os dois ícones são renderizados e o CSS `dark:` escolhe; isso também acabou com a instabilidade dos e2e de cadastro (o re-render do React apagava campos já preenchidos).
- Campo de nickname do cadastro agora aceita dígitos e `_`, como o schema (que passou a exigir minúsculas, igual ao campo).
- Troca de senha: com senha atual errada, os campos não somem mais da tela (o form usava `action`, que o React reseta).
- O layout raiz renderizava cada página duas vezes (uma árvore por breakpoint): ids duplicados, efeitos e chamadas de API em dobro, erro de hidratação.
- Formulários com Zod 4 (cadastro, contato, dados da conta) quebravam lendo `ZodError.errors`; agora usam `.issues`. Cadastro novo redireciona para `/minha-conta` (antes caía em `/feed` por um redirecionamento concorrente).
- Login por senha e formulário de contato falhavam em produção: o servidor lia `CLOUDFLARE_TURNSTILE_SECRET_KEY` (inexistente) e o client dependia de `NEXT_PUBLIC_NODE_ENV` (nunca definido).
- Toasts de perfil, pergunta, pagamento e ranking nunca apareciam (usavam uma cópia do store que o `<Toaster>` não escuta).
- Rotas desconectavam o client Prisma compartilhado ao fim de cada requisição.
- `biome.json` no schema errado quebrava o hook `pre-commit`.
- Seed roda no SQLite (`skipDuplicates` só é enviado fora dele).
- Um único landmark `<main>` por página (13 páginas tinham um `<main>` dentro do do layout).
- Cadastro por email em produção: o captcha não aparecia no primeiro acesso à página, então todo cadastro falhava. Um `TurnstileWidget` único agora atende login, cadastro e contato.
- Mensagem de "usuário sem senha" no login nunca aparecia (o servidor lançava um texto em inglês que a tela não reconhecia).

### Added

- **Pagamento com créditos via Stripe**, ao lado do PIX. O usuário compra créditos em dólar (Stripe Checkout, `POST /api/stripe/checkout`) e paga perguntas com eles (`POST /api/question/create-with-credits`). O webhook `/api/webhook/stripe` credita a compra de forma idempotente.
- **Stripe Connect (Accounts v2, conta de recebimento)**: quem recebe perguntas se cadastra pela Stripe em Minha Conta. Ao responder uma pergunta paga com créditos, o valor sem a taxa da plataforma é transferido para a conta conectada; pergunta recusada, expirada ou denunciada devolve os créditos inteiros a quem perguntou. O cron diário refaz liquidações pendentes.
- `questions.currency` (`BRL` para PIX, `USD` para créditos), `questions.stripe_transfer_id`, `users.credits_cents`, `users.stripe_account_id` e a tabela `stripe_purchases`. `questions.webhook_id` virou opcional.

- CI/CD com GitHub Actions: `ci.yml` (lint, format, typecheck, `bun audit`, unit, integração, build + smoke, todos bloqueantes), `e2e.yml` (Playwright) e `deploy.yml` (Vercel, só após CI verde em `main`). Ver `docs/deployment.md`.
- `lib/session.ts` (`getSessionUser`) e services testados para regras que movem dinheiro: `withdraw.service`, `question-create.service`, `question-expiry.service`.
- Testes de integração para saque (incluindo concorrência), criação de pergunta, expiração e autorização do cron. Teste e2e de regressão para renderização única do layout. O e2e de cadastro, antes `fixme`, agora passa.
- `.editorconfig` na raiz (tab, largura 4, LF; YAML e `package.json` com espaços) e `.gitattributes` fixando LF.
- Skills de agentes vendorizadas em `.claude/skills/` (impeccable, ponytail, addyosmani/agent-skills, graphify, frontend-design), com agentes em `.claude/agents/` e checklists em `.claude/references/`; origem e commits em `.claude/skills/SOURCES.md`. `.graphifyignore` para o knowledge graph.
- Fase final no `PLAN.md`: auditoria de segurança da aplicação inteira contra o OWASP Top Ten.
- Testes unitários (`lib/`), integração (`tests/integration/`), smoke (`tests/smoke/`) e e2e com Playwright (`tests/e2e/`).
- `AGENTS.md`/`CLAUDE.md` na raiz e documentação em `docs/` focada em dar contexto para agentes de IA.
- Pasta `setups/` com scripts de setup local (Windows/Unix × SQLite/Postgres/Postgres+Docker) e `infra/` com Docker/docker-compose.
- Conventional Commits obrigatório via commitlint no hook `commit-msg`.
- "Reportar resposta" funciona: quem perguntou pode reportar a resposta recebida (uma vez, só depois de respondida).

### Changed

- Dependências atualizadas para as últimas versões estáveis, com versão fixa: Next 16.4.0, TypeScript 7.0.2, Radix UI, React Query 5.104.1, Resend 6.32.1, lucide-react 1.55.0, Biome 2.5.15, Playwright 1.64.0, entre outras. Prisma fica em 7.10.0 (a 8 ainda é release candidate).
- A sessão do NextAuth carrega só a própria conta. Perguntas, seguidores e bloqueios são buscados por tela (`actions/my-account-actions.ts`); o contador da sidebar virou um `COUNT` no banco.
- **Prisma 6 → 7.10.0** com driver adapters (`@prisma/adapter-pg`; `@prisma/adapter-libsql` para SQLite local), `prisma.config.ts`, client gerado em `prisma/generated/` e uma única instância compartilhada. Rode `bun run prisma:generate` após instalar. `SQLITE_DATABASE_URL` deixou de existir: use `DATABASE_URL="file:./dev.db"`.
- `@react-email/components` 0.0.41 → 1.0.12.
- `typescript.ignoreBuildErrors` removido: o build volta a checar tipos (0 erros). Lint com 0 erros em todo o código (antes só `app/` era verificado).
- Server Actions usam `updateTag` (Next 16) no lugar de `revalidateTag` com um argumento.
- Biome lê o `.editorconfig` e formata também `tests/` e configs da raiz.
- `TODO.md` renomeado para `PLAN.md`.
- Bun 1.4.2 como package manager oficial; dependências com versão exata pinada.
- A sessão do NextAuth não grava mais `last_login_at` nem reativa conta a cada leitura (só no sign-in), e usuários relacionados vêm só com campos públicos.
- Todos os warnings do Biome corrigidos; `lint:ci` falha com warning.

### Removed

- `framer-motion` (girava um ícone que já girava com `animate-spin`, dobrando a velocidade do spinner).
- `@prisma/extension-accelerate` (sem efeito com `DATABASE_URL` Postgres comum).
- 30 componentes shadcn e 28 dependências sem nenhum import; o CLI `vercel` como devDependency (chamado pinado no workflow); código morto (`actions/question-actions.ts`, `lib/create-pix-payment.ts`, `lib/rate-limiter.ts` não usado, rota vazia `report-answer`).
- "Sacar perguntas não respondidas": não tinha tela, e a rota chamada nunca existiu.
- Estado e handlers de curtir/descurtir em "Perguntas enviadas", que nunca eram renderizados.

## [1.0.0] - 2026-09-23

Primeira versão com versionamento formal. Ponto de partida do histórico deste changelog — o histórico anterior de commits não seguia Conventional Commits.
