# Testes

**Status atual: em construção** (ver Fase 8 em `TODO.md`). Este documento descreve a estratégia alvo; os comandos abaixo só existem depois que a fase de testes for implementada.

## Runner

`bun:test` (nativo do Bun) para unit/funcional/integração/smoke. [Playwright](https://playwright.dev) só para e2e.

## Tipos

| Tipo | O que cobre | Onde |
|---|---|---|
| Unitário/funcional | funções puras (`lib/utils/*`), hooks isolados | `*.test.ts` ao lado do arquivo testado |
| Integração | rotas de API + Prisma contra um Postgres de teste real (não mockado) | `app/api/**/*.integration.test.ts` |
| Smoke | a aplicação sobe e responde (`bun run build && bun run start` + checar `/api/health`) | script dedicado, roda no CI antes de qualquer outra suíte |
| E2E | fluxos completos no browser (login, criar pergunta, pagar PIX simulado, responder) | `e2e/*.spec.ts` (Playwright) |

## Rodando (quando implementado)

```bash
bun run test            # unit + funcional + integração
bun run test:unit
bun run test:integration
bun run test:smoke
bun run test:e2e        # playwright
```

## Regra para testes de integração

Nunca rodar contra o banco de desenvolvimento com dados reais/seed. Usar um Postgres descartável (ver `infra/docker-compose.yaml` ou um container efêmero) com `DATABASE_URL` próprio, migration aplicada do zero a cada run.
