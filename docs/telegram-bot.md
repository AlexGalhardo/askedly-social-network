# Telegram bot/logger

`lib/telegram-logger.ts` is an observability logger, not an interactive bot: it sends messages to a Telegram channel through the Bot API's `sendMessage`. It does not receive or process commands.

## Configuration

- `TELEGRAM_BOT_HTTP_TOKEN` — the bot token (`https://api.telegram.org/bot<TOKEN>/getUpdates` to find/validate it)
- `TELEGRAM_BOT_CHANNEL_ID` — numeric id of the destination channel/chat

Both are optional (`lib/env.ts` only warns at build time when they are missing). Without them, the class just logs a warning to the console (`"There is no Telegram Token..."`) and carries on without sending anything — it does not break the application.

## Usage

```ts
import TelegramLog from "@/lib/telegram-logger";

await TelegramLog.info("informational message");
await TelegramLog.warning("warning message");
await TelegramLog.error("error message");
```

Used today for: authentication errors (`lib/auth.ts`), captcha errors (`lib/captcha.ts`), the first rate limit violation of each window (`lib/services/rate-limit.service.ts`), payments confirmed by the webhooks (`app/api/webhook/abacatepay/route.ts`, `app/api/webhook/stripe/route.ts`), failed Stripe transfers (`lib/services/stripe-connect.service.ts`) and cron errors (`app/api/cronjob/route.ts`). 8 s timeout per request through `AbortController` — a failed send must never bring down the main flow.

Log messages are internal and are not translated.
