import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { PAYMENTS_SIMULATED } from "@/lib/payment-simulation";

// AbacatePay secrets: they can only be read on the server. Never import this module in a client component
// nor use the NEXT_PUBLIC_ prefix, which embeds the value in the browser's public bundle.
export const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY;
export const ABACATEPAY_WEBHOOK_SECRET = process.env.ABACATEPAY_WEBHOOK_SECRET;

const API_URL = "https://api.abacatepay.com/v2";

// Public key (not a secret) with which AbacatePay signs the X-Webhook-Signature header.
// Source: https://docs.abacatepay.com/pages/webhooks/security
const ABACATEPAY_WEBHOOK_PUBLIC_KEY =
	"t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

export type PixChargeStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED" | "REFUNDED";

export interface PixCharge {
	id: string;
	amount: number;
	status: PixChargeStatus;
	devMode: boolean;
	brCode: string;
	brCodeBase64: string;
	platformFee: number;
	expiresAt: string;
}

export class AbacatePayError extends Error {}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	if (!ABACATEPAY_API_KEY) throw new AbacatePayError("ABACATEPAY_API_KEY is not configured");

	const response = await fetch(`${API_URL}${path}`, {
		...init,
		headers: { Authorization: `Bearer ${ABACATEPAY_API_KEY}`, "Content-Type": "application/json" },
	});
	const body = (await response.json().catch(() => null)) as { data?: T; error?: unknown } | null;

	if (!response.ok || !body?.data) {
		throw new AbacatePayError(`AbacatePay ${path}: ${JSON.stringify(body?.error ?? response.status)}`);
	}
	return body.data;
}

export function createPixCharge(input: {
	amount: number;
	description: string;
	expiresIn: number;
	metadata?: Record<string, string>;
}): Promise<PixCharge> {
	if (PAYMENTS_SIMULATED) {
		return Promise.resolve({
			id: `sim_${randomUUID()}`,
			amount: input.amount,
			status: "PENDING",
			devMode: true,
			brCode: "SIMULATED-PIX",
			// 1x1 PNG: the screen requires a QR code image.
			brCodeBase64:
				"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
			platformFee: 0,
			expiresAt: new Date(Date.now() + input.expiresIn * 1000).toISOString(),
		});
	}
	return request<PixCharge>("/transparents/create", {
		method: "POST",
		body: JSON.stringify({ method: "PIX", data: input }),
	});
}

export function checkPixCharge(id: string): Promise<{ id: string; status: PixChargeStatus; expiresAt: string }> {
	if (PAYMENTS_SIMULATED) return Promise.resolve({ id, status: "PAID", expiresAt: new Date().toISOString() });
	return request(`/transparents/check?id=${encodeURIComponent(id)}`);
}

/** Only works with a sandbox key (devMode). */
export function simulatePixPayment(id: string): Promise<{ id: string; status: PixChargeStatus }> {
	if (PAYMENTS_SIMULATED) return Promise.resolve({ id, status: "PAID" });
	return request(`/transparents/simulate-payment?id=${encodeURIComponent(id)}`, {
		method: "POST",
		body: JSON.stringify({ metadata: {} }),
	});
}

/** HMAC-SHA256 (base64) of the raw body; constant-time comparison. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
	if (!signature) return false;
	const expected = Buffer.from(
		createHmac("sha256", ABACATEPAY_WEBHOOK_PUBLIC_KEY).update(Buffer.from(rawBody, "utf8")).digest("base64"),
	);
	const received = Buffer.from(signature);
	return expected.length === received.length && timingSafeEqual(expected, received);
}
