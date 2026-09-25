import { describe, expect, test } from "bun:test";
import { createHmac } from "node:crypto";
import { verifyWebhookSignature } from "@/lib/abacatepay";

// Mesma chave pública documentada em https://docs.abacatepay.com/pages/webhooks/security
const PUBLIC_KEY =
	"t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";
const body = JSON.stringify({
	id: "log_1",
	event: "transparent.completed",
	data: { transparent: { id: "pix_char_1" } },
});
const sign = (raw: string) => createHmac("sha256", PUBLIC_KEY).update(raw).digest("base64");

describe("verifyWebhookSignature", () => {
	test("accepts a body signed by AbacatePay", () => {
		expect(verifyWebhookSignature(body, sign(body))).toBe(true);
	});

	test("rejects a tampered body", () => {
		expect(verifyWebhookSignature(body.replace("pix_char_1", "pix_char_2"), sign(body))).toBe(false);
	});

	test("rejects a missing or malformed signature", () => {
		expect(verifyWebhookSignature(body, null)).toBe(false);
		expect(verifyWebhookSignature(body, "abc")).toBe(false);
	});
});
