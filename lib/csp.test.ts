import { describe, expect, test } from "bun:test";
import { buildContentSecurityPolicy } from "./csp";

const directive = (csp: string, name: string): string => csp.split("; ").find((d) => d.startsWith(`${name} `)) ?? "";

describe("buildContentSecurityPolicy", () => {
	test("only runs scripts carrying this request's nonce", () => {
		const scripts = directive(buildContentSecurityPolicy("abc123", false), "script-src");
		expect(scripts).toContain("'nonce-abc123'");
		expect(scripts).toContain("'strict-dynamic'");
		expect(scripts).not.toContain("'unsafe-inline'");
		expect(scripts).not.toContain("'unsafe-eval'");
	});

	test("allows eval only in development (React uses it for error stacks)", () => {
		expect(directive(buildContentSecurityPolicy("n", true), "script-src")).toContain("'unsafe-eval'");
	});

	test("blocks plugins, base-tag hijacking and framing", () => {
		const csp = buildContentSecurityPolicy("n", false);
		expect(directive(csp, "object-src")).toBe("object-src 'none'");
		expect(directive(csp, "base-uri")).toBe("base-uri 'self'");
		expect(directive(csp, "frame-ancestors")).toBe("frame-ancestors 'none'");
	});
});
