import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { validateEnv } from "./lib/env";

validateEnv();

// Headers que não dependem do conteúdo da página. Um CSP completo (script-src com nonce) exigiria liberar Turnstile,
// UploadThing e os scripts inline do Next; fica registrado em docs/security.md como próximo passo.
const securityHeaders = [
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	// Anti-clickjacking: X-Frame-Options para browsers antigos, frame-ancestors para os atuais.
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
	{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
	// Sem includeSubDomains/preload: são compromissos difíceis de desfazer para o domínio inteiro.
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
