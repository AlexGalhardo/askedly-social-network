# Pagamentos com Stripe (créditos e Connect)

Segundo meio de pagamento, ao lado do PIX ([`payments-pix.md`](payments-pix.md)). O PIX é em reais e o saque é manual; a Stripe é em dólar e o repasse é automático.

| | PIX (AbacatePay) | Créditos (Stripe) |
| --- | --- | --- |
| Moeda (`questions.currency`) | `BRL` | `USD` |
| Quem pergunta paga | um PIX por pergunta | com créditos comprados antes por cartão |
| Quem responde recebe | saldo sacado para a chave PIX, em `/payments` | transferência Stripe para a conta conectada, ao responder |
| Recusada, expirada ou denunciada | reembolso sacável por quem perguntou | créditos inteiros de volta a quem perguntou |
| Taxa da plataforma | `calculatePayout` (`lib/services/withdraw.service.ts`) | a mesma função |

## Fluxo

1. **Comprar créditos.** `POST /api/stripe/checkout` (`{ amount }` em centavos, de US$ 5 a US$ 1.000) cria um Checkout hospedado pela Stripe e grava `stripe_purchases` como `pending`. 1 crédito = 1 centavo de dólar.
2. **Webhook** `POST /api/webhook/stripe` confere a assinatura (`STRIPE_WEBHOOK_SECRET`) sobre o corpo cru e, em `checkout.session.completed` ou `checkout.session.async_payment_succeeded` com `payment_status` diferente de `unpaid`, chama `fulfillCreditsPurchase`: marca a compra `completed` e soma `users.credits_cents` na mesma transação. Eventos repetidos encontram a compra já concluída e não creditam de novo. `checkout.session.expired` e `async_payment_failed` marcam `expired`.
3. **Perguntar com créditos.** `POST /api/question/create-with-credits` chama `createCreditQuestion`: o débito é um `updateMany` condicionado ao saldo, na mesma transação que cria a pergunta (`currency: "USD"`, sem `webhook_id`). Valor de US$ 2 a US$ 1.000, validado no servidor.
4. **Liquidar.** Quando a pergunta sai da fila (respondida, recusada, expirada ou denunciada), a rota chama `settleCreditQuestion` (`lib/services/stripe-connect.service.ts`):
   - respondida: transfere `calculatePayout(amount_paid)` para a conta conectada do dono e grava `stripe_transfer_id`;
   - recusada, expirada ou denunciada: devolve `amount_paid` inteiro aos créditos de quem perguntou.

   `questions.amount_already_withdraw` marca a liquidação, então a função pode rodar várias vezes. Se o dono ainda não tem conta apta, ou a plataforma não tem saldo disponível, nada muda e o cron diário (`settlePendingCreditQuestions`, em `/api/cronjob`) tenta de novo. O cron também expira perguntas em créditos vencidas.

## Stripe Connect

- **Modelo:** marketplace com "separate charges and transfers". A compra de créditos entra inteira na conta da plataforma; o repasse acontece depois, por `transfers.create`, e a taxa da plataforma é a diferença que não é transferida. `application_fee_amount` não se aplica a esse modelo.
- **Conta conectada:** Accounts v2 (`stripe.v2.core.accounts.create`), configuração `recipient` com a capacidade `stripe_balance.stripe_transfers`, `dashboard: "express"`, `fees_collector` e `losses_collector` em `application`. Criada uma vez por usuário em `POST /api/stripe/connect` (`{ country }`), que devolve o link de onboarding hospedado pela Stripe.
- **Antes de transferir** o código confere `configuration.recipient.capabilities.stripe_balance.stripe_transfers.status === "active"`.
- **Nunca transferir duas vezes:** a transferência usa `transfer_group: question_<id>` e chave de idempotência; antes de criar, o código procura uma transferência já existente no grupo (cobre a queda entre a Stripe responder e o banco gravar).
- `GET /api/stripe/connect` devolve `{ credits, payoutStatus }` do usuário da sessão (`none`, `pending` ou `active`).

## Variáveis de ambiente

| Variável | Uso |
| --- | --- |
| `STRIPE_SECRET_KEY` | Server-only. Prefira chave restrita (`rk_`) com escrita em Checkout Sessions, Transfers e Connect |
| `STRIPE_WEBHOOK_SECRET` | Segredo de assinatura do endpoint `/api/webhook/stripe` |
| `PAYMENTS_SIMULATED` | `true` liga o modo demonstração, sem chamar gateway. Ignorado em produção na Vercel. Ver [`docker.md`](docker.md) |

Não existe chave publicável: o app só redireciona para páginas hospedadas pela Stripe, sem Stripe.js, então o CSP não muda.

Configuração da conta e do webhook: [`stripe-setup.md`](stripe-setup.md).

## Limites conhecidos

- **Saldo disponível.** Pagamento por cartão leva dias para sair de "pendente". Com pouco volume, a transferência pode falhar por saldo insuficiente; o cron refaz no dia seguinte. Em teste, o cartão `4000 0000 0000 0077` credita o saldo disponível na hora.
- **Reembolso e disputa da compra de créditos** (`charge.refunded`, `charge.dispute.created`) não são tratados: os créditos continuam com o usuário. Estorne manualmente em `users.credits_cents` até isso existir.
- **Créditos não viram dinheiro para quem comprou.** Só voltam como crédito.
- **Impostos:** `automatic_tax` não está ligado.

## Testes

`tests/integration/stripe-credits.test.ts` prova, contra Postgres real e sem chamar a Stripe: webhook repetido ou concorrente credita uma vez; perguntas simultâneas não gastam o mesmo crédito; valor abaixo do mínimo e saldo insuficiente não debitam; recusa devolve os créditos uma vez; resposta transfere o valor sem a taxa uma vez.
