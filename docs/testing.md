# Testes

## Runner

`bun:test` (nativo do Bun) para unit/funcional/integração/smoke. [Playwright](https://playwright.dev) só para e2e.

## Tipos

| Tipo | O que cobre | Onde |
|---|---|---|
| Unitário/funcional | funções puras (`lib/utils/*`, `lib/date-time.ts`, `lib/utils.ts`, cálculo de repasse, sanitização de perfil) e o teste de guarda que proíbe `"use server"` em `lib/` | `*.test.ts` ao lado do arquivo testado |
| Integração | repositórios e services contra um Postgres de teste real (não mockado): usuários, saque (incluindo saque concorrente), criação de pergunta (valor do webhook, limite diário), expiração, autorização do cron, troca de senha (senha atual obrigatória, conta Google definindo a primeira), cadastro validado no servidor, feed sem dado privado nem autor de pergunta anônima | `tests/integration/*.test.ts` |
| Smoke | a aplicação sobe com `node .../next start` e responde (`/api/health` e `/`) | `tests/smoke/*.test.ts` |
| E2E | fluxos no browser: home, formulário de login, cadastro, troca de senha pedindo a senha atual. Fluxo de pergunta paga via PIX/responder ainda não coberto | `tests/e2e/*.spec.ts` (Playwright) |

## Rodando

```bash
bun run test            # unit + funcional (lib/, hooks/)
bun run test:unit
bun run test:integration  # precisa de DATABASE_URL apontando pra um Postgres real e descartável
bun run test:smoke        # precisa de `bun run build` antes (o teste sobe o `next start` sozinho)
bun run test:e2e          # playwright: localmente sobe `next dev`; com CI=true usa `next start` (rode `bun run build` antes)
```

Localmente, rode o e2e com `NEXTAUTH_URL=http://localhost:3200` (a porta do Playwright): o `signOut` da troca de senha redireciona para o `NEXTAUTH_URL`.

No modo `CI=true` o captcha é obrigatório (produção). Rode o build com as chaves de teste da Cloudflare em `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY`/`CLOUDFLARE_TURNSTILE_SECRET` (ver `deployment.md`); `tests/e2e/helpers.ts` espera o token antes de enviar formulários.

**Regra:** nunca rodar `test:integration`/`test:smoke` contra o banco de desenvolvimento com dados reais/seed — sempre um Postgres descartável (`infra/docker-compose.yaml` ou um container efêmero) com migration aplicada do zero.

No CI (`.github/workflows/ci.yml` e `e2e.yml`) cada tipo roda num job separado com Postgres em service container — ver [`deployment.md`](deployment.md).
