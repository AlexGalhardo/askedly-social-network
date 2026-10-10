import { NextRequest, NextResponse } from "next/server";
import { buildContentSecurityPolicy } from "@/lib/csp";

// Rotas antigas em português: links e buscadores antigos continuam funcionando.
const legacyRoutes: Record<string, string> = {
	entrar: "login",
	"criar-conta": "signup",
	"esqueci-senha": "forgot-password",
	"alterar-senha": "change-password",
	"minha-conta": "my-account",
	pagamentos: "payments",
	"perguntas-enviadas": "sent-questions",
	"perguntas-recebidas": "received-questions",
	"politica-de-privacidade": "privacy-policy",
	"termos-de-uso": "terms-of-use",
	seguidores: "followers",
	seguindo: "following",
	sobre: "about",
	contato: "contact",
	"top-curtidas": "top-liked",
	teste: "",
};

export default function proxy(request: NextRequest) {
	const [, first, ...rest] = request.nextUrl.pathname.split("/");

	if (Object.hasOwn(legacyRoutes, first)) {
		const url = request.nextUrl.clone();
		url.pathname = `/${[legacyRoutes[first], ...rest].filter(Boolean).join("/")}`;
		return NextResponse.redirect(url, 301);
	}

	// Nonce novo a cada requisição. O Next lê o CSP do header da requisição e aplica o nonce nos próprios scripts;
	// o layout repassa `x-nonce` para os scripts inline (tema, analytics).
	const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
	const csp = buildContentSecurityPolicy(nonce, process.env.NODE_ENV === "development");

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-nonce", nonce);
	requestHeaders.set("Content-Security-Policy", csp);

	const response = NextResponse.next({ request: { headers: requestHeaders } });
	response.headers.set("Content-Security-Policy", csp);
	return response;
}

export const config = {
	matcher: [
		{
			// API, arquivos estáticos e prefetch não renderizam HTML: não precisam de nonce.
			source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
			missing: [
				{ type: "header", key: "next-router-prefetch" },
				{ type: "header", key: "purpose", value: "prefetch" },
			],
		},
	],
};
