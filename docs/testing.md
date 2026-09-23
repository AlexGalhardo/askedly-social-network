# Testes

## Runner

`bun:test` (nativo do Bun) para unit/funcional/integração/smoke. [Playwright](https://playwright.dev) só para e2e.

## Tipos

| Tipo | O que cobre | Onde |
|---|---|---|
| Unitário/funcional | funções puras (`lib/utils/*`, `lib/date-time.ts`, `lib/utils.ts`) | `*.test.ts` ao lado do arquivo testado |
| Integração | repositórios (`lib/repositories/*`) contra um Postgres de teste real (não mockado) | `tests/integration/*.test.ts` |
| Smoke | a aplicação sobe e responde (`bun run build && bun run start` + checar `/api/health`) | `tests/smoke/*.test.ts` |
| E2E | fluxos completos no browser (login, criar pergunta, pagar PIX simulado, responder) | `tests/e2e/*.spec.ts` (Playwright) |

## Rodando

```bash
bun run test            # unit + funcional (lib/, hooks/)
bun run test:unit
bun run test:integration  # precisa de DATABASE_URL apontando pra um Postgres real e descartável
bun run test:smoke        # precisa do build de produção rodando (bun run build && bun run start)
bun run test:e2e          # playwright
```

**Regra:** nunca rodar `test:integration`/`test:smoke` contra o banco de desenvolvimento com dados reais/seed — sempre um Postgres descartável (`infra/docker-compose.yaml` ou um container efêmero) com migration aplicada do zero.
