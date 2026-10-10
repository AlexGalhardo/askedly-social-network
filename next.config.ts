import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { validateEnv } from "./lib/env";

validateEnv();

// Headers that do not depend on the page content. A full CSP (script-src with nonce) would require allowing Turnstile,
// UploadThing and Next's inline scripts; it is recorded in docs/security.md as the next step.
const securityHeaders = [
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	// Anti-clickjacking: X-Frame-Options for old browsers, frame-ancestors for current ones.
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
	{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
	// No includeSubDomains/preload: those are commitments that are hard to undo for the whole domain.
	{ key: "Strict-Transport-Security", value: "max-age=63072000" },
];

const nextConfig: NextConfig = {
	images: {
		unoptimized: true,
	},
	async headers() {
		return [{ source: "/(.*)", headers: securityHeaders }];
	},
};

export default createNextIntlPlugin("./i18n/request.ts")(nextConfig);
