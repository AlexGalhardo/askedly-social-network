# Aplicação completa em Docker (modo demonstração)

Sobe o produto inteiro sem nenhuma conta externa: Postgres, migrations, seed e o app em build de produção, com pagamentos simulados.

```bash
docker compose -f infra/docker-compose.demo.yaml up --build
```

Abra <http://localhost:3000>. Para zerar tudo: `docker compose -f infra/docker-compose.demo.yaml down -v`.

## Contas do seed

| Conta | Email | Senha |
| --- | --- | --- |
| Admin (painel em `/admin`) | `admin@gmail.com` | `adminBR@123` |

O seed cria também 60 usuários aleatórios, seguidores, 200 perguntas PIX em todos os estados e os dados de pagamento de demonstração (`prisma/services/seed-payments-demo.service.ts`): compras de créditos concluídas e expiradas, 24 perguntas pagas com créditos (respondidas, aguardando e recusadas), perguntas PIX recebidas pelo admin, um saque no histórico, e o admin com US$ 50 de créditos e conta de recebimento já cadastrada.

## O que cada serviço faz

| Serviço | Papel |
| --- | --- |
| `db` | Postgres 17, volume `demo_pgdata` |
| `setup` | Roda uma vez (`infra/demo-setup.sh`): `prisma migrate deploy` e, só se o banco estiver vazio, o seed |
| `app` | `next start` na porta 3000, depois que o `setup` termina com sucesso |

## Pagamentos simulados

`PAYMENTS_SIMULATED=true` (`lib/payment-simulation.ts`) troca as chamadas aos gateways por respostas locais:

| Ação | Em produção | No modo demonstração |
| --- | --- | --- |
| Gerar PIX | cobrança na AbacatePay | cobrança fictícia `sim_...`, com QR code de 1 pixel |
| Confirmar PIX | webhook ou consulta | a primeira consulta do modal já devolve `PAID` (cerca de 5 s) |
| Comprar créditos | Stripe Checkout + webhook | creditado na hora, sem sair do app |
| Cadastrar conta de recebimento | onboarding da Stripe | conta `acct_sim_...` gravada na hora |
| Repasse ao responder | `transfers.create` | transferência `tr_sim_...` registrada |

O resto do código é o mesmo de produção: débito de créditos, liquidação, taxa da plataforma, saque e painel do admin rodam de verdade contra o banco.

**Isso dá dinheiro de graça.** A variável é ignorada quando `VERCEL_ENV=production`. Fora da Vercel, nunca a defina em um ambiente com usuários reais.

## Roteiro para ver tudo funcionando

1. Entre como `admin@gmail.com` e abra `/admin`: totais por moeda, receita da plataforma, compras e saques.
2. Em Minha Conta, compre créditos: o saldo sobe na hora.
3. Abra o perfil de outro usuário e envie uma pergunta, uma vez por PIX (confirma sozinho) e outra com créditos.
4. Em Pagamentos, saque o saldo PIX do admin (mínimo de R$ 100).
5. Troque o idioma no seletor da barra lateral.

## Detalhes

- O captcha usa as chaves de teste oficiais da Cloudflare Turnstile, que sempre passam. O navegador precisa alcançar `challenges.cloudflare.com`.
- Emails (reset de senha, contato), upload de avatar, login com Google e logs no Telegram ficam sem chave e não funcionam no modo demonstração.
- O cron diário não roda sozinho. Para disparar: `curl -H "Authorization: Bearer docker-demo-cron" http://localhost:3000/api/cronjob`.
- `NEXTAUTH_SECRET` e `CRON_SECRET` do compose são valores de demonstração, públicos. Não reutilize.
- Só o banco, para desenvolver com `bun run dev`: `infra/docker-compose.yaml` e os scripts de `setups/`.
