type HeaderSource = Headers | Record<string, unknown>;

function readHeader(headers: HeaderSource, name: string): string | undefined {
	if (headers instanceof Headers) return headers.get(name) ?? undefined;
	const value = headers[name];
	return typeof value === "string" ? value : undefined;
}

/**
 * IP do cliente para rate limit. Na Vercel o `x-forwarded-for` é reescrito pela plataforma, então o primeiro valor
 * é confiável; fora dela (dev local) pode ser forjado, o que só afeta o próprio dev.
 */
export function clientIp(headers: HeaderSource): string {
	return (
		readHeader(headers, "x-forwarded-for")?.split(",")[0]?.trim() || readHeader(headers, "x-real-ip") || "unknown"
	);
}
