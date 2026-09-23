# Banco de Dados

ORM: Prisma 6 (`@prisma/client`). Produção/dev padrão: **PostgreSQL**, definido em `prisma/schema.prisma` (`provider = "postgresql"`, `url = env("DATABASE_URL")`).

## Models (resumo)

| Model | Papel |
|---|---|
| `User` | conta, perfil público, configs de privacidade (`privacy_*`), limites diários de perguntas |
| `Question` | pergunta paga; sempre ligada 1:1 a um `WebhookAbacatePay` (`webhook_id` único) |
| `WebhookAbacatePay` | eventos brutos recebidos do gateway PIX — fonte de verdade do pagamento |
| `Follower` / `FollowRequest` | grafo social; `FollowRequest` só existe para perfis privados |
| `UserBlock` | bloqueios entre usuários |
| `PaymentWithdraw` | saques de saldo acumulado via chave PIX |
| `DeletedAccount` | snapshot de conta excluída (soft delete + auditoria) |

Todos os IDs são UUID (`@default(uuid())`). Nomes de tabela em `snake_case` via `@@map`.

## Comandos

```bash
bun run prisma:generate   # gera o client
bun run prisma:migrate    # cria/aplica migration em dev
bun run prisma:studio     # GUI do banco
bun run prisma:db:seed    # popula com dados fake (ver prisma/seed.ts)
```

## SQLite para dev local (sem Docker)

`prisma/schema.prisma` continua sendo Postgres (produção). Os scripts `setups/setup-*-sqlite.sh` usam um schema espelhado `prisma/schema.sqlite.prisma` (provider `"sqlite"`) só para rodar localmente sem subir um Postgres.

**Importante:** esse schema espelho não é gerado automaticamente — sempre que `prisma/schema.prisma` mudar, replique manualmente a mudança em `prisma/schema.sqlite.prisma`. Tipos sem equivalente direto em SQLite (ex: nada muito exótico é usado hoje) precisam de ajuste manual nesse arquivo.

## Seed

`prisma/seed-orchestrator.ts` chama os `services/` e `factories/` em `prisma/` para gerar usuários, perguntas e relações de seguidores fake. Quantidade controlada por `SEED_TOTAL_RANDOM_USERS_TO_CREATED`, `SEED_TOTAL_FOLLOWERS_RELATIONS` e `SEED_RANDOM_QUESTIONS_TO_CREATE` no `.env`.
