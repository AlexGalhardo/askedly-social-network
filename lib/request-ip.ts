type HeaderSource = Headers | Record<string, unknown>;

function readHeader(headers: HeaderSource, name: string): string | undefined {
	if (headers instanceof Headers) return headers.get(name) ?? undefined;
	const value = headers[name];
	return typeof value === "string" ? value : undefined;
}

/**
 * Client IP for rate limiting. On Vercel `x-forwarded-for` is rewritten by the platform, so the first value
 * is trustworthy; outside it (local dev) it can be forged, which only affects the dev themselves.
 */
export function clientIp(headers: HeaderSource): string {
	return (
		readHeader(headers, "x-forwarded-for")?.split(",")[0]?.trim() || readHeader(headers, "x-real-ip") || "unknown"
	);
}
