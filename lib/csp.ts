// Origens externas que o site usa de fato. Ao integrar um serviço novo, adicione aqui e rode o e2e
// tests/e2e/csp.spec.ts, que falha em qualquer violação de CSP.
const CONNECT_SOURCES = [
	"https://*.uploadthing.com", // UploadThing: upload do avatar
	"https://*.ufs.sh",
	"https://utfs.io",
	"https://challenges.cloudflare.com", // Turnstile
	"https://*.google-analytics.com",
	"https://*.analytics.google.com",
	"https://*.googletagmanager.com",
	"https://*.clarity.ms",
];

/**
 * CSP estrito por nonce (gerado a cada requisição em proxy.ts). `'strict-dynamic'` libera os scripts que um script
 * com nonce carrega (next/script, Speed Insights, Turnstile), sem lista de hosts para script.
 * `style-src` precisa de `'unsafe-inline'`: bibliotecas de UI usam o atributo `style`, que nonce não cobre.
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
