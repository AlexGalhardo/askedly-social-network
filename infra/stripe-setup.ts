// Configures Stripe for this app idempotently: creates (or updates) the webhook endpoint and shows what is
// missing in the dashboard. Usage: STRIPE_SECRET_KEY=sk_... APP_URL=https://your-domain bun infra/stripe-setup.ts
// See docs/stripe-setup.md.
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
	console.error("Set STRIPE_SECRET_KEY and APP_URL (e.g. https://askedly.example.com).");
	process.exit(1);
}

async function main(stripeKey: string, baseUrl: string): Promise<void> {
	const stripe = new Stripe(stripeKey);
	const url = new URL("/api/webhook/stripe", baseUrl).toString();

	console.log(`Mode: ${stripeKey.includes("_live_") ? "LIVE" : "test"}`);

	const { data: endpoints } = await stripe.webhookEndpoints.list({ limit: 100 });
	const existing = endpoints.find((endpoint) => endpoint.url === url);

	if (existing) {
		await stripe.webhookEndpoints.update(existing.id, { enabled_events: WEBHOOK_EVENTS });
		console.log(`Webhook already existed and was updated: ${existing.id} -> ${url}`);
		console.log(
			"The signing secret is only shown on creation. If you lost it, generate another one in Developers > Webhooks.",
		);
	} else {
		const endpoint = await stripe.webhookEndpoints.create({ url, enabled_events: WEBHOOK_EVENTS });
		console.log(`Webhook created: ${endpoint.id} -> ${url}`);
		console.log(`STRIPE_WEBHOOK_SECRET=${endpoint.secret}`);
	}

	console.log(`
	Still to check in the dashboard (there is no API for this):
	- Connect enabled at https://dashboard.stripe.com/connect, with the platform profile filled in.
	- Available balance on the platform: transfers come out of the available balance, not the pending one.`);
}

main(key, appUrl).catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : error);
	process.exit(1);
});
