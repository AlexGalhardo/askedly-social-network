# Pagamentos PIX (AbacatePay)

Toda pergunta enviada no app é paga via PIX através do gateway [AbacatePay](https://abacatepay.com). Não existe pergunta gratuita: o model `Question` exige `webhook_id` (único, obrigatório) apontando para um `WebhookAbacatePay` confirmado.

## Fluxo

1. **Criar cobrança** — `app/api/pix/create/route.ts` chama a API da AbacatePay e devolve o QR Code/copia-e-cola. `lib/create-pix-payment.ts` é o client-side helper que dispara essa chamada.
2. **Aguardar pagamento** — `app/api/pix/check/route.ts` faz polling do status da cobrança (usado enquanto o QR Code está na tela).
3. **Webhook de confirmação** — AbacatePay chama `app/api/webhook/abacatepay/route.ts` (POST) quando o PIX é pago:
   - valida `webhookSecret` na query string contra `ABACATEPAY_WEBHOOK_SECRET` (recusa tudo se a variável não estiver definida);
   - grava o evento bruto em `WebhookAbacatePay` (fonte de verdade do pagamento);
   - notifica o Telegram (ver [`telegram-bot.md`](telegram-bot.md)).
4. **Criar a pergunta** — só depois do webhook confirmado, o fluxo de `app/api/question/create` liga a pergunta ao `webhook_id` pago.
5. **Simulação em dev**: `app/api/pix/simulate-payment/route.ts` simula o pagamento sem PIX real, e só responde com `NEXT_PUBLIC_TEST_MODE=true`; fora disso retorna 404.

## Saques

`processWithdraw` (`actions/payment-actions.ts`) chama `withdrawBalance()` (`lib/services/withdraw.service.ts`) com o id **da sessão**. O servidor confere se as perguntas são do usuário, calcula o valor (`calculatePayout`: 50% até R$ 5,00, 70% acima, arredondado para cima) e paga a `pix_key` cadastrada, tudo numa transação que impede sacar a mesma pergunta duas vezes. Nada disso vem do client. Model: `PaymentWithdraw`.

## Variáveis de ambiente

- `ABACATEPAY_API_KEY` e `ABACATEPAY_WEBHOOK_SECRET`: **server-only**, lidas só em `lib/abacatepay.ts`. Localmente, a chave de dev da AbacatePay; na Vercel, a de produção.
- `NEXT_PUBLIC_TEST_MODE` (flag pública, não é segredo) e `DANGER_MODE`.

Nunca use `NEXT_PUBLIC_` para segredo: o Next embute esses valores no JavaScript enviado ao navegador. Até a correção, a API key era `NEXT_PUBLIC_*` e era importada por um componente client, então ficou exposta no bundle público. **A chave de produção deve ser rotacionada** no painel da AbacatePay.
