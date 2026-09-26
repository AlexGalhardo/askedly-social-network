# Deploy

## Vercel

Projeto `respondeae` no time "Fitness Projects", ligado ao repositório pela **integração Git da Vercel**: todo push em `main` vira deploy de produção e todo PR ganha um preview.

- O build roda o script `vercel-build` (`infra/vercel-build.sh`), que a Vercel prefere ao `build`:
  1. `prisma generate` — o client do Prisma 7 fica em `prisma/generated/`, fora do git; sem isso o build falha com `Can't resolve './generated/prisma/client'`;
  2. `prisma migrate deploy` **só quando `VERCEL_ENV=production`** — preview e produção usam o mesmo `DATABASE_URL`, e um PR com migration nova não pode alterar o banco de produção só por gerar um preview;
  3. `next build`.
- O build não precisa de segredo de runtime (o client da Resend é criado na hora do envio).
- `vercel.json` define um cron (`/api/cronjob`, todo dia às 3h) que reseta os limites diários de perguntas, apaga contas excluídas há mais de 30 dias ou inativas há mais de 2 anos e limpa janelas vencidas de rate limit. A rota exige `Authorization: Bearer $CRON_SECRET`, que a Vercel envia sozinha quando a variável existe no projeto.
- `@vercel/speed-insights` já integrado em `app/layout.tsx`.

### Variáveis de ambiente (dashboard da Vercel)

`.env.example` é a referência. Além das que o projeto já tem, produção precisa de:

- `CRON_SECRET` — sem ela o cron diário recebe 401 e nada é limpo;
- `RESEND_FROM_EMAIL` — remetente de domínio verificado na Resend; sem ele, emails de reset de senha só chegam ao dono da conta Resend;
- `ABACATEPAY_API_KEY`/`ABACATEPAY_WEBHOOK_SECRET` com a chave **nova** (a antiga ficou exposta no bundle e precisa ser rotacionada);
- `NEXT_PUBLIC_TEST_MODE` precisa ser `false` (ou não existir) em produção. Mesmo ligado, `simulate-payment` recusa quando `VERCEL_ENV=production`.

`NODE_ENV` não deve ser definido à mão (a Vercel define), e `SEED_*`/`DANGER_MODE` não são usados em produção.

### Domínios e proteção de deploy

Produção responde em **`https://respondeae.vercel.app`** (público). O projeto usa Vercel Authentication, então os outros domínios `*.vercel.app` (ex.: `respondeae-galhardos-projects.vercel.app` e as URLs de cada deploy) redirecionam para o login da Vercel. Por isso o webhook da AbacatePay e o `NEXT_PUBLIC_APP_URL`/`NEXTAUTH_URL` precisam usar `respondeae.vercel.app` (ou um domínio customizado). Verificado em produção: `/api/health` 200, headers de segurança presentes, webhook e cron sem secret respondem 401.

## CI/CD (GitHub Actions, `.github/workflows/`)

- **`ci.yml`** (PR e push em `main`): jobs `lint` (Biome), `typecheck` (`tsc --noEmit`), `security-audit` (`bun audit --audit-level=high`), `unit-tests`, `integration-tests` (Postgres em service container) e `build` (Postgres + `bun run test:smoke`).
- **`e2e.yml`** (PR e push em `main`): sobe Postgres em service container, instala o Chromium do Playwright, roda `bun run build` e `bun run test:e2e` (servidor de produção). Em falha, sobe o relatório HTML (`playwright-report/`, gerado só com `CI=true`) como artifact.
- O deploy **não** passa pelo GitHub Actions: a integração Git da Vercel já faz isso (o antigo `deploy.yml` foi removido para não haver deploy duplicado). Para a produção só subir com o CI verde, ative "Deployment Checks" no projeto da Vercel exigindo os checks `CI` e `E2E`.
- Todos os workflows usam `concurrency` para cancelar execuções antigas da mesma branch.
- **Dependabot** (`.github/dependabot.yml`): ecossistema `bun` (o `npm_and_yarn` padrão falhava por não saber atualizar o `bun.lock`) e `github-actions`, semanal, minor/patch agrupados.

### Todos os jobs bloqueiam

- `lint` roda `bun run lint:ci`, que falha também com **warning** do Biome (`--error-on-warnings`).
- `typecheck` (`tsc --noEmit`, sem `ignoreBuildErrors` no `next.config`).
- `security-audit` (`bun audit --audit-level=high`). A única exceção (`--ignore=GHSA-ggr8-5vv4-36mx`) é o `deepmerge-ts`, que só existe no CLI do Prisma e nunca roda em produção.
- `unit-tests` roda `prisma:generate` antes: alguns testes unitários importam services que importam o client.
- O e2e roda contra `next build` + `next start` (produção), com as chaves de teste oficiais da Cloudflare para o Turnstile (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`), que sempre passam.
- Smoke e e2e sobem o Next com **Node**, como na Vercel: sob o runtime do Bun os módulos que o Turbopack externaliza (`@prisma/client`, `pg`) não resolvem.

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
