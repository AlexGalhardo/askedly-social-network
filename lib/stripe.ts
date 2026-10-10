import Stripe from "stripe";

let client: Stripe | undefined;

/** Cliente server-only. Use uma chave restrita (`rk_`) com acesso a Checkout, Transfers e Connect. */
export function getStripe(): Stripe {
	const key = process.env.STRIPE_SECRET_KEY;
	if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
	client ??= new Stripe(key);
	return client;
}

export function appUrl(path: string): string {
	return new URL(path, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").toString();
}
