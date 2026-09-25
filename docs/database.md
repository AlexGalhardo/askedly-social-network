# Banco de Dados

ORM: Prisma 7 (`@prisma/client` + driver adapter). Produção/dev padrão: **PostgreSQL**, definido em `prisma/schema.prisma` (`provider = "postgresql"`).

## Como o Prisma 7 está configurado

- **`prisma.config.ts`** (raiz) é a configuração do CLI: schema, migrations, comando de seed e a URL (`DATABASE_URL`, carregada via `dotenv`). No Prisma 7 a URL não fica mais no `schema.prisma`, e o seed não fica mais em `package.json#prisma`.
- **Client gerado** em `prisma/generated/prisma/` (generator `prisma-client`, ignorado no git). Rode `bun run prisma:generate` depois de `bun install` ou de mudar o schema, pois o Prisma 7 não gera mais o client sozinho.
- **Instância única** em `prisma/prisma-client.ts`: `import { prisma } from "@/prisma/prisma-client"`. Nunca crie `new PrismaClient()` em outro lugar, porque cada instância abre seu próprio pool de conexões. Ela usa o adapter `@prisma/adapter-pg` para Postgres e `@prisma/adapter-libsql` quando `DATABASE_URL` começa com `file:`.

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

`prisma/schema.prisma` continua sendo Postgres (produção). Os scripts `setups/setup-*-sqlite.sh` gravam `DATABASE_URL="file:./dev.db"` no `.env`; com esse prefixo, o `prisma.config.ts` usa o schema espelhado `prisma/schema.sqlite.prisma` e o client usa o adapter libSQL. Não há migrations para SQLite: o schema é aplicado com `bunx prisma db push`.

- libSQL em vez de `better-sqlite3`: `better-sqlite3` não roda no Bun, que executa o seed e os scripts.
- O seed ainda não funciona no SQLite, porque usa `createMany({ skipDuplicates })`, que o SQLite não suporta. Está registrado no `PLAN.md`.

**Importante:** esse schema espelho não é gerado automaticamente — sempre que `prisma/schema.prisma` mudar, replique manualmente a mudança em `prisma/schema.sqlite.prisma`. Tipos sem equivalente direto em SQLite (ex: nada muito exótico é usado hoje) precisam de ajuste manual nesse arquivo.

## Seed

`prisma/seed-orchestrator.ts` chama os `services/` e `factories/` em `prisma/` para gerar usuários, perguntas e relações de seguidores fake. Quantidade controlada por `SEED_TOTAL_RANDOM_USERS_TO_CREATED`, `SEED_TOTAL_FOLLOWERS_RELATIONS` e `SEED_RANDOM_QUESTIONS_TO_CREATE` no `.env`.
