import { NextRequest, NextResponse } from "next/server";
import { buildContentSecurityPolicy } from "@/lib/csp";

const redirectMap: Record<string, string> = {
	"/teste": "/",
};

export default function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const redirectTo = redirectMap[pathname.replace(/^\/+/, "")];
	if (redirectTo) return NextResponse.redirect(new URL(`/${redirectTo}`, request.url), 301);

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
