# Configurar a Stripe

O que o app precisa da Stripe: uma chave de API, Connect ativado e um endpoint de webhook. O fluxo de pagamento está em [`payments-stripe.md`](payments-stripe.md).

## Versão manual, passo a passo

1. **Conta.** Crie ou abra a conta em <https://dashboard.stripe.com>. Para testar, use um sandbox (canto superior esquerdo, "Sandboxes"): dados e chaves separados da conta real.
2. **Connect.** Em <https://dashboard.stripe.com/connect>, ative o Connect e preencha o perfil da plataforma (modelo "marketplace": a plataforma cobra, depois repassa).
3. **Chave de API.** Em Developers > API keys, crie uma **chave restrita** (`rk_...`) com escrita em: Checkout Sessions, Transfers, Connect (contas v2 e account links) e Webhook Endpoints (esta última só para o script do passo 4; pode ser removida depois). Guarde como `STRIPE_SECRET_KEY`.
4. **Webhook.** Com a URL pública do app:

   ```bash
   STRIPE_SECRET_KEY=rk_... APP_URL=https://seu-dominio bun infra/stripe-setup.ts
   ```

   O script cria o endpoint `https://seu-dominio/api/webhook/stripe` com os quatro eventos de Checkout e imprime `STRIPE_WEBHOOK_SECRET=whsec_...`. Rodar de novo só atualiza os eventos (o segredo aparece apenas na criação). Pelo painel, o equivalente é Developers > Webhooks > Add endpoint, com os eventos `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` e `checkout.session.expired`.
5. **Variáveis.** Grave `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` no `.env` local e na Vercel (ver [`vercel-deploy.md`](vercel-deploy.md)). Nunca com prefixo `NEXT_PUBLIC_`.
6. **Conferir.** Logado no app, em Minha Conta: compre créditos com o cartão de teste `4000 0000 0000 0077` (cai direto no saldo disponível), confira o saldo de créditos, cadastre a conta de recebimento, envie e responda uma pergunta paga com créditos e veja a transferência em Connect > Transfers.

### Webhook em desenvolvimento local

A Stripe não alcança `localhost`. Com a [Stripe CLI](https://docs.stripe.com/stripe-cli):

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhook/stripe   # imprime o whsec_ local
stripe trigger checkout.session.completed                       # evento de teste
```

Sem conta nenhuma, use o modo demonstração de [`docker.md`](docker.md).

## Versão com agentes de IA (CLI e MCP)

Um agente com acesso ao terminal faz os passos 3 a 6. Os passos 1 e 2 dependem de aceite de termos e dados da empresa: são seus.

**Pré-requisitos que só você pode dar:**

- Stripe CLI autenticada (`stripe login`), ou o MCP da Stripe conectado (`/mcp`, servidor `stripe`, que abre o login no navegador), ou a chave restrita em uma variável de ambiente da sessão.
- Vercel CLI autenticada (`vercel whoami`) e o projeto vinculado (`vercel link`).

**Pedido para o agente:**

```text
Configure a Stripe deste projeto em modo de teste, seguindo docs/stripe-setup.md:
1. Confira o acesso: `stripe whoami --format json` e `vercel whoami`.
2. Rode `bun infra/stripe-setup.ts` com APP_URL da produção e guarde o STRIPE_WEBHOOK_SECRET impresso.
3. Grave STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET na Vercel (production e preview) com `vercel env add`,
   sem imprimir os valores.
4. Faça um novo deploy e confira: POST sem assinatura em /api/webhook/stripe responde 400.
5. Dispare `stripe trigger checkout.session.completed` e confirme a entrega em `stripe events list`.
Não use chaves live e não crie cobranças reais.
```

**O que cada ferramenta cobre:**

| Tarefa | CLI | MCP |
| --- | --- | --- |
| Criar e listar webhooks | `stripe webhook_endpoints create`, ou `bun infra/stripe-setup.ts` | servidor `stripe` |
| Disparar e inspecionar eventos | `stripe trigger`, `stripe events list`, `stripe logs tail` | servidor `stripe` |
| Gravar variáveis na Vercel | `vercel env add NOME production` | servidor `vercel` (`create_project_env`) |
| Ativar Connect, aceitar termos | não há | não há: painel, por você |

**Regras para o agente:** chave restrita, nunca a secreta completa; nunca imprimir ou commitar segredos; modo de teste até você pedir o contrário; qualquer ação em modo live (criar webhook live, trocar chave) pede sua confirmação antes.

## Ir para produção

- Repita o passo 3 e o 4 com chaves live e a URL de produção.
- Confira no painel os meios de pagamento ativos (o Checkout mostra o que estiver habilitado; o código não fixa `payment_method_types`).
- Leia a lista de <https://docs.stripe.com/get-started/checklist/go-live> e os limites em [`payments-stripe.md`](payments-stripe.md#limites-conhecidos).
