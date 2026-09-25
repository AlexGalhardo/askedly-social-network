# Deploy

## Vercel

- `vercel.json` define um cron (`/api/cronjob`, todo dia às 3h) que reseta os limites diários de perguntas e apaga contas excluídas há mais de 30 dias ou inativas há mais de 2 anos. A rota exige `Authorization: Bearer $CRON_SECRET`, que a Vercel envia sozinha quando a variável `CRON_SECRET` existe no projeto.
- `@vercel/speed-insights` já integrado em `app/layout.tsx`.
- Variáveis de ambiente de produção são configuradas direto no dashboard da Vercel (nunca commitar `.env`; usar `.env.example` como referência do que precisa existir). Além das já existentes, a Fase 11 passou a exigir:
  - `ABACATEPAY_API_KEY` e `ABACATEPAY_WEBHOOK_SECRET` (substituem as antigas `NEXT_PUBLIC_*`; **rotacione a chave**, que ficou exposta no bundle);
  - `CRON_SECRET` (sem ela o cron diário passa a receber 401);
  - `CLOUDFLARE_TURNSTILE_SECRET` (o nome que o código lê agora).

## CI/CD (GitHub Actions, `.github/workflows/`)

- **`ci.yml`** (PR e push em `main`): jobs `lint` (Biome), `typecheck` (`tsc --noEmit`), `security-audit` (`bun audit --audit-level=high`), `unit-tests`, `integration-tests` (Postgres em service container) e `build` (Postgres + `bun run test:smoke`).
- **`e2e.yml`** (PR e push em `main`): sobe Postgres em service container, instala o Chromium do Playwright e roda `bun run test:e2e`. Em falha, sobe o relatório HTML (`playwright-report/`, gerado só com `CI=true`) como artifact.
- **`deploy.yml`** (disparado por `workflow_run` quando o `CI` termina com sucesso num push em `main`): `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`. O CLI é chamado como `bunx vercel@<versão>` pinado no próprio workflow — **não** é devDependency do projeto (só esse workflow usa, e ele trazia ~16 vulnerabilidades transitivas para o `bun.lock`).
- Todos os workflows usam `concurrency` para cancelar execuções antigas da mesma branch; o deploy nunca é cancelado no meio.

### Secrets necessários (Settings → Environments → `production`)

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` — obtidos rodando `bunx vercel link` localmente na conta/projeto Vercel corretos e lendo `.vercel/project.json`.

> Se o projeto também estiver conectado à integração Git da Vercel, cada push em `main` gera **dois** deploys. Escolha um: ou desligue o auto-deploy da integração Git (Project Settings → Git → Ignored Build Step: `exit 0`), ou apague o `deploy.yml`.

### Jobs não bloqueantes (dívida da Fase 11)

`lint`, `typecheck` e `security-audit` rodam com `continue-on-error: true` porque hoje há dívida pré-existente: ~31 erros de lint, ~35 erros de tipo (o build só passa por `typescript.ignoreBuildErrors`) e vulnerabilidades transitivas conhecidas. Remover o `continue-on-error` de cada um assim que a respectiva dívida for paga — deixar o CI permanentemente verde escondendo um gate quebrado é pior do que não ter o job.

### Validar workflows localmente

```bash
docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:1.7.7
```

## Build local antes de deploy

```bash
bun install
bun run build
bun run start   # valida o build de produção localmente
```

O build faz queries reais ao Prisma em páginas estáticas (ex: `/top-curtidas`) — `DATABASE_URL` precisa apontar para um Postgres acessível mesmo em build time, não só em runtime.
