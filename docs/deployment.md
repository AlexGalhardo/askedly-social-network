# Deploy

**Status atual:** deploy manual/automático via integração Git da Vercel (sem workflow de CI próprio ainda — ver Fase 10 em `TODO.md` para o CI/CD com GitHub Actions planejado).

## Vercel

- `vercel.json` define um cron (`/api/cronjob`, todo dia às 3h) — usado para expirar perguntas não respondidas dentro do prazo.
- `@vercel/speed-insights` já integrado em `app/layout.tsx`.
- Variáveis de ambiente de produção são configuradas direto no dashboard da Vercel (nunca commitar `.env`; usar `.env.example` como referência do que precisa existir).

## CI/CD planejado (Fase 10)

1. `ci.yml` — lint (`bun run lint`) + testes (`bun run test`) + build (`bun run build`) em todo PR
2. `e2e.yml` — Playwright contra um preview deployment ou ambiente efêmero com Postgres em container
3. `deploy.yml` — deploy para produção na Vercel ao dar merge em `main`

## Build local antes de deploy

```bash
bun install
bun run build
bun run start   # valida o build de produção localmente
```

O build faz queries reais ao Prisma em páginas estáticas (ex: `/top-curtidas`) — `DATABASE_URL` precisa apontar para um Postgres acessível mesmo em build time, não só em runtime.
