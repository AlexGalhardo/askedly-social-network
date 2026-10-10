// Configura a Stripe para este app de forma idempotente: cria (ou atualiza) o endpoint de webhook e mostra o que
// falta no painel. Uso: STRIPE_SECRET_KEY=sk_... APP_URL=https://seu-dominio bun infra/stripe-setup.ts
// Ver docs/stripe-setup.md.
import Stripe from "stripe";

const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
	"checkout.session.completed",
	"checkout.session.async_payment_succeeded",
	"checkout.session.async_payment_failed",
	"checkout.session.expired",
];

const key = process.env.STRIPE_SECRET_KEY;
const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
if (!key || !appUrl) {
	console.error("Defina STRIPE_SECRET_KEY e APP_URL (ex.: https://askedly.example.com).");
	process.exit(1);
}

async function main(stripeKey: string, baseUrl: string): Promise<void> {
	const stripe = new Stripe(stripeKey);
	const url = new URL("/api/webhook/stripe", baseUrl).toString();

	console.log(`Modo ${stripeKey.includes("_live_") ? "LIVE" : "teste"}`);

	const { data: endpoints } = await stripe.webhookEndpoints.list({ limit: 100 });
	const existing = endpoints.find((endpoint) => endpoint.url === url);

	if (existing) {
		await stripe.webhookEndpoints.update(existing.id, { enabled_events: WEBHOOK_EVENTS });
		console.log(`Webhook já existia e foi atualizado: ${existing.id} -> ${url}`);
		console.log("O segredo de assinatura só aparece na criação. Se perdeu, gere outro em Developers > Webhooks.");
	} else {
		const endpoint = await stripe.webhookEndpoints.create({ url, enabled_events: WEBHOOK_EVENTS });
		console.log(`Webhook criado: ${endpoint.id} -> ${url}`);
		console.log(`STRIPE_WEBHOOK_SECRET=${endpoint.secret}`);
	}

	console.log(`
	Falta conferir no painel (não há API para isto):
	- Connect ativado em https://dashboard.stripe.com/connect, com perfil de plataforma preenchido.
	- Saldo disponível na plataforma: as transferências saem do saldo disponível, não do pendente.`);
}

main(key, appUrl).catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
