# Pagamentos PIX (AbacatePay)

Toda pergunta enviada no app é paga via PIX através do gateway [AbacatePay](https://abacatepay.com). Não existe pergunta gratuita: o model `Question` exige `webhook_id` (único, obrigatório) apontando para um `WebhookAbacatePay` confirmado.

## Fluxo (API v2, `https://api.abacatepay.com/v2`, checkout transparente)

Cliente HTTP em `lib/abacatepay.ts` (server-only); regras em `lib/services/pix-charge.service.ts`.

1. **Criar cobrança**: `POST /api/pix/create` (exige login) chama `POST /transparents/create` com `method: "PIX"` e grava a cobrança em `WebhookAbacatePay` com status `PENDING`, **o valor devolvido pela AbacatePay** e o `userId` de quem vai pagar. Devolve `brCode` (copia-e-cola) e `brCodeBase64` (QR Code).
2. **Aguardar pagamento**: `GET /api/pix/check` (só o dono da cobrança) consulta `GET /transparents/check`. Na v2 ele devolve apenas `id`, `status` e `expiresAt`, sem o valor, e por isso o valor é gravado no passo 1.
3. **Webhook**: a AbacatePay chama `POST /api/webhook/abacatepay?webhookSecret=...` no evento `transparent.completed`. A rota valida o secret da URL **e** a assinatura HMAC-SHA256 do header `X-Webhook-Signature` sobre o corpo cru (chave pública documentada pela AbacatePay). Marca a cobrança como `PAID` de forma idempotente: retentativas do mesmo evento não reprocessam. Outros eventos recebem 200 e são ignorados.
4. **Criar a pergunta**: `createPaidQuestion` exige cobrança `PAID` **do próprio usuário**. Se o webhook ainda não chegou, confirma na hora via `check`, o que elimina a corrida entre o polling do modal e o webhook. O valor da pergunta é o da cobrança; um PIX só vale para uma pergunta.
5. **Simulação** (`NEXT_PUBLIC_TEST_MODE=true` + chave sandbox `abc_dev_...`): o modal chama `POST /api/pix/simulate-payment`, que usa `POST /transparents/simulate-payment`. Fora do modo de teste retorna 404.

### Configurar o webhook no painel da AbacatePay

- URL: `https://<domínio>/api/webhook/abacatepay?webhookSecret=<ABACATEPAY_WEBHOOK_SECRET>`
- Evento: `transparent.completed`
- Crie um webhook em **Dev mode** para a chave sandbox e outro em **Produção** para a chave real.

## Saques

`processWithdraw` (`actions/payment-actions.ts`) chama `withdrawBalance()` (`lib/services/withdraw.service.ts`) com o id **da sessão**. O servidor confere se as perguntas são do usuário, calcula o valor (`calculatePayout`: 50% até R$ 5,00, 70% acima, arredondado para cima) e paga a `pix_key` cadastrada, tudo numa transação que impede sacar a mesma pergunta duas vezes. Nada disso vem do client. Model: `PaymentWithdraw`.

## Variáveis de ambiente

- `ABACATEPAY_API_KEY` e `ABACATEPAY_WEBHOOK_SECRET`: **server-only**, lidas só em `lib/abacatepay.ts`. Localmente, a chave de dev da AbacatePay; na Vercel, a de produção.
- `NEXT_PUBLIC_TEST_MODE` (flag pública, não é segredo) e `DANGER_MODE`.

Nunca use `NEXT_PUBLIC_` para segredo: o Next embute esses valores no JavaScript enviado ao navegador. Até a correção, a API key era `NEXT_PUBLIC_*` e era importada por um componente client, então ficou exposta no bundle público. **A chave de produção deve ser rotacionada** no painel da AbacatePay.
