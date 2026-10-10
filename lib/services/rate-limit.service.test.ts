import { describe, expect, test } from "bun:test";
import { maskEmail } from "./rate-limit.service";

describe("maskEmail", () => {
	test("masks the email in a rate-limit key", () => {
		expect(maskEmail("login:email:john@example.com")).toBe("login:email:j***@example.com");
	});

	test("leaves keys without an email alone", () => {
		expect(maskEmail("signup:ip:203.0.113.7")).toBe("signup:ip:203.0.113.7");
	});
});
