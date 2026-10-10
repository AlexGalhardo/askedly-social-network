// External origins the site actually uses. When integrating a new service, add it here and run the e2e
// tests/e2e/csp.spec.ts, which fails on any CSP violation.
const CONNECT_SOURCES = [
	"https://*.uploadthing.com", // UploadThing: avatar upload
	"https://*.ufs.sh",
	"https://utfs.io",
	"https://challenges.cloudflare.com", // Turnstile
	"https://*.google-analytics.com",
	"https://*.analytics.google.com",
	"https://*.googletagmanager.com",
	"https://*.clarity.ms",
];

/**
 * Strict nonce-based CSP (generated on every request in proxy.ts). `'strict-dynamic'` allows the scripts that a script
 * with a nonce loads (next/script, Speed Insights, Turnstile), with no host list for scripts.
 * `style-src` needs `'unsafe-inline'`: UI libraries use the `style` attribute, which a nonce does not cover.
 */
export function buildContentSecurityPolicy(nonce: string, isDev: boolean): string {
	const directives = [
		"default-src 'self'",
		`script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
		"style-src 'self' 'unsafe-inline'",
		"img-src 'self' data: blob: https:",
		"font-src 'self' data:",
		`connect-src 'self' ${CONNECT_SOURCES.join(" ")}${isDev ? " ws: wss:" : ""}`,
		"frame-src https://challenges.cloudflare.com",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
	];
	return directives.join("; ");
}
