# Pagamentos PIX (AbacatePay)

Toda pergunta enviada no app é paga via PIX através do gateway [AbacatePay](https://abacatepay.com). Não existe pergunta gratuita: o model `Question` exige `webhook_id` (único, obrigatório) apontando para um `WebhookAbacatePay` confirmado.

## Fluxo

1. **Criar cobrança** — `app/api/pix/create/route.ts` chama a API da AbacatePay e devolve o QR Code/copia-e-cola. `lib/create-pix-payment.ts` é o client-side helper que dispara essa chamada.
2. **Aguardar pagamento** — `app/api/pix/check/route.ts` faz polling do status da cobrança (usado enquanto o QR Code está na tela).
3. **Webhook de confirmação** — AbacatePay chama `app/api/webhook/abacatepay/route.ts` (POST) quando o PIX é pago:
   - valida `webhookSecret` na query string contra `NEXT_PUBLIC_ABACATEPAY_WEBHOOK_SECRET`;
   - grava o evento bruto em `WebhookAbacatePay` (fonte de verdade do pagamento);
   - notifica o Telegram (ver [`telegram-bot.md`](telegram-bot.md)).
4. **Criar a pergunta** — só depois do webhook confirmado, o fluxo de `app/api/question/create` liga a pergunta ao `webhook_id` pago.
5. **Simulação em dev** — `app/api/pix/simulate-payment/route.ts` e a env `NEXT_PUBLIC_TEST_MODE=true` permitem simular pagamento sem PIX real. Página de referência: `app/pix-test/page.tsx`.

## Saques

`app/api/payments/withdraw/route.ts` + model `PaymentWithdraw`: o usuário que respondeu perguntas acumula saldo e saca para sua `pix_key` cadastrada (`app/minha-conta/pix-form.tsx`).

## Variáveis de ambiente

`NEXT_PUBLIC_ABACATEPAY_API_KEY`, `NEXT_PUBLIC_ABACATEPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_TEST_ABACATEPAY_API_KEY_PROD`, `NEXT_PUBLIC_TEST_MODE`, `DANGER_MODE`.

**Atenção:** as chaves de API estão como `NEXT_PUBLIC_*`, ou seja, expostas ao client. Isso é um risco de segurança existente a revisar na fase de auditoria OWASP do `TODO.md` — o ideal é mover a criação de cobrança inteiramente para o servidor sem expor a API key no bundle do browser.
