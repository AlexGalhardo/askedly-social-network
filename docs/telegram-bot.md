# Bot/Logger do Telegram

`lib/telegram-logger.ts` é um logger de observabilidade, não um bot interativo: envia mensagens para um canal do Telegram via `sendMessage` da Bot API. Não recebe nem processa comandos.

## Configuração

- `TELEGRAM_BOT_HTTP_TOKEN` — token do bot (`https://api.telegram.org/bot<TOKEN>/getUpdates` para descobrir/validar)
- `TELEGRAM_BOT_CHANNEL_ID` — id numérico do canal/chat de destino

Sem essas variáveis, a classe apenas loga um aviso no console (`"There is no Telegram Token..."`) e segue sem enviar nada — não quebra a aplicação.

## Uso

```ts
import TelegramLog from "@/lib/telegram-logger";

await TelegramLog.info("mensagem informativa");
await TelegramLog.error("mensagem de erro");
```

Usado hoje para: erros de autenticação (`lib/auth.ts`), erros de criação de pagamento PIX (`lib/create-pix-payment.ts`), e confirmação de pagamento recebido pelo webhook (`app/api/webhook/abacatepay/route.ts`). Timeout de 8s por requisição via `AbortController` — falha de envio nunca deve derrubar o fluxo principal.
