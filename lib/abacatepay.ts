import { createHmac, timingSafeEqual } from "node:crypto";

// Segredos da AbacatePay: só podem ser lidos no servidor. Nunca importe este módulo em componente client
// nem use prefixo NEXT_PUBLIC_, que embute o valor no bundle público do navegador.
export const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY;
export const ABACATEPAY_WEBHOOK_SECRET = process.env.ABACATEPAY_WEBHOOK_SECRET;

const API_URL = "https://api.abacatepay.com/v2";

// Chave pública (não é segredo) com que a AbacatePay assina o header X-Webhook-Signature.
// Fonte: https://docs.abacatepay.com/pages/webhooks/security
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
	if (!ABACATEPAY_API_KEY) throw new AbacatePayError("ABACATEPAY_API_KEY não configurada");

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
	return request<PixCharge>("/transparents/create", {
		method: "POST",
		body: JSON.stringify({ method: "PIX", data: input }),
	});
}

export function checkPixCharge(id: string): Promise<{ id: string; status: PixChargeStatus; expiresAt: string }> {
	return request(`/transparents/check?id=${encodeURIComponent(id)}`);
}

/** Só funciona com chave de sandbox (devMode). */
export function simulatePixPayment(id: string): Promise<{ id: string; status: PixChargeStatus }> {
	return request(`/transparents/simulate-payment?id=${encodeURIComponent(id)}`, {
		method: "POST",
		body: JSON.stringify({ metadata: {} }),
	});
}

/** HMAC-SHA256 (base64) do corpo cru; comparação em tempo constante. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
	if (!signature) return false;
	const expected = Buffer.from(
		createHmac("sha256", ABACATEPAY_WEBHOOK_PUBLIC_KEY).update(Buffer.from(rawBody, "utf8")).digest("base64"),
	);
	const received = Buffer.from(signature);
	return expected.length === received.length && timingSafeEqual(expected, received);
}
